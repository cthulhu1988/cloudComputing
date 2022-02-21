#!/usr/bin/env python

## send the command 'debug'  from d02.html


###  Note that on some systems python2.7 may be required.
###  But 2.6.6 seems to be adequate now.

###  This is a hacked version of the python websocket server that I use
###  with our vw3 game engine.  For these demos, there are changes:
###      1.  defaults to PORT 12345 below
###      2.  only understands a command named debug, so you have to 
###          send that as the "command" in demo01.html
###      3.  only understands the latest ws protocol

import socket
import threading
import struct
import hashlib
import base64  # added by RMB for encode/decode
import numpy   # added by RMB for encode/decode
import time    # added by RMB to  time sending files

PORT = 5995


def create_handshake_response(handshake):  # hybi (06-10, 17?)
    key = ""
    for line in handshake.split('\r\n'):
        values = line.split(": ")
        if values[0] == "Sec-WebSocket-Key":
            key = values[1]
            break
    
    shasum = hashlib.sha1()
    shasum.update(key)
    shasum.update("258EAFA5-E914-47DA-95CA-C5AB0DC85B11")  # protocol magic
    key = base64.b64encode(shasum.digest())
    
    return (
            "HTTP/1.1 101 Switching Protocols\r\n"
            "Upgrade: websocket\r\n"
            "Connection: Upgrade\r\n"
            "Sec-Websocket-Accept: " + key + "\r\n\r\n"
            ## "\r\n"
           )


def encode_msg(msg, opcode = 0x01, usebase64=False):
    # opcodes:
    #     0x0 - continuation
    #     0x1 - text frame (may use base64)
    #     0x2 - binary frame (use raw buf)
    #     0x8 - connection close
    #     0x9 - ping
    #     0xA - pong

    fin = True  ### RMB set
    if fin:
        finbit = 0x80
    else:
        finbit = 0
    frame = struct.pack("B", finbit | opcode)
    l = len(msg)
    if l < 126:
        frame += struct.pack("B", l)
    elif l <= 0xFFFF:
        frame += struct.pack("!BH", 126, l)
    else:
        frame += struct.pack("!BQ", 127, l)
    frame += msg
    return frame

    if usebase64:
        msg = base64.b64encode(msg)
    b1 = 0x80 | (opcode & 0x0f)  # FIN + opcode
    payload_len = len(msg)
    if payload_len <= 125:
        header = struct.pack('>BB', b1, payload_len)
    elif payload_len > 125 and payload_len < 65536:
        header = struct.pack('>BBH', b1, 126, payload_len)
    elif payload_len >= 65536:
        header = struct.pack('>BBQ', b1, 127, payload_len)
    print "encoded header:", repr(header)
    print "encoded msg   :", repr(msg)

    return header + msg

def decode_hybi(buf,usebase64=False):
    """ Decode HyBi style WebSocket packets.
    Returns:
        {'fin'          : 0_or_1,
         'opcode'       : number,
         'mask'         : 32_bit_number,
         'length'       : payload_bytes_number,
         'payload'      : decoded_buffer,
         'left'         : bytes_left_number,
         'close_code'   : number,
         'close_reason' : string}
    """

    ret = {'fin'          : 0,
           'opcode'       : 0,
           'mask'         : 0,
           'length'       : 0,
           'payload'      : None,
           'left'         : 0,
           'close_code'   : None,
           'close_reason' : None}

    blen = len(buf)
    ret['left'] = blen
    header_len = 2

    if blen < header_len:
        return ret # Incomplete frame header

    b1, b2 = struct.unpack_from(">BB", buf)
    ret['opcode'] = b1 & 0x0f
    ret['fin'] = (b1 & 0x80) >> 7
    has_mask = (b2 & 0x80) >> 7

    ret['length'] = b2 & 0x7f

    if ret['length'] == 126:
        header_len = 4
        if blen < header_len:
            return ret # Incomplete frame header
        (ret['length'],) = struct.unpack_from('>xxH', buf)
    elif ret['length'] == 127:
        header_len = 10
        if blen < header_len:
            return ret # Incomplete frame header
        (ret['length'],) = struct.unpack_from('>xxQ', buf)

    full_len = header_len + has_mask * 4 + ret['length']

    if blen < full_len: # Incomplete frame
        return ret # Incomplete frame header

    # Number of bytes that are part of the next frame(s)
    ret['left'] = blen - full_len

    # Process 1 frame
    if has_mask:
        # unmask payload
        ret['mask'] = buf[header_len:header_len+4]
        b = c = ''
        if ret['length'] >= 4:
            mask = numpy.frombuffer(buf, dtype=numpy.dtype('<u4'),  # RMB chgd from L4 for 32/64-bit problem
                    offset=header_len, count=1)
            data = numpy.frombuffer(buf, dtype=numpy.dtype('<u4'),  # RMB chgd from L4 for 32/64-bit problem
                    offset=header_len + 4, count=int(ret['length'] / 4))
            #b = numpy.bitwise_xor(data, mask).data
            b = numpy.bitwise_xor(data, mask).tostring()

        if ret['length'] % 4:
            print "Partial unmask"
            mask = numpy.frombuffer(buf, dtype=numpy.dtype('B'),
                    offset=header_len, count=(ret['length'] % 4))
            data = numpy.frombuffer(buf, dtype=numpy.dtype('B'),
                    offset=full_len - (ret['length'] % 4),
                    count=(ret['length'] % 4))
            c = numpy.bitwise_xor(data, mask).tostring()
        ret['payload'] = b + c
    else:
        print "Unmasked frame:", repr(buf)
        ret['payload'] = buf[(header_len + has_mask * 4):full_len]

    if usebase64 and ret['opcode'] in [1, 2]:  ## RMB chgd usebase64 test
        # print "RMB DEBUG USING base64"
        try:
            ret['payload'] = base64.b64decode(ret['payload'])
        except:
            print "Exception while b64decoding buffer:", repr(buf)
            raise

    if ret['opcode'] == 0x08:
        if ret['length'] >= 2:
            ret['close_code'] = struct.unpack_from(">H", ret['payload'])
        if ret['length'] > 3:
            ret['close_reason'] = ret['payload'][2:]

    return ret

def handle_connection(sock,addr):
    recvdMsg = sock.recv(1024)
    print "msg for initial contact |%s|" % recvdMsg
    if "Sec-WebSocket-Key:" in recvdMsg:
        msgToSend = create_handshake_response(recvdMsg)
    else:
        print "**** RECVD BAD HANDSHAKE"
        return
    sock.send(msgToSend)

    while True:
        print "waiting for msg from", sock, addr
        recvdMsg = sock.recv(1024)
        print "recvd:", recvdMsg
        if not recvdMsg:
            print "no data; dropping the connection"
            break
        decodedMsg = decode_hybi(recvdMsg)
        print "decodedMsg:", decodedMsg
        splitMsg = decodedMsg['payload'].split()
        print "splitMsg:", splitMsg
        if splitMsg[0] == "getjson":
            startTime = time.time()
            try:
                f = open(splitMsg[1])
            except:
                print "** failed to open json file:", splitMsg[1]
                return
            #### dataFromFile = f.read(4000)
            #### while dataFromFile:
                #### msgToSend = encode_msg(dataFromFile)
                ## RMB DEBUG single frame masked Hello
                ## msgToSend = "\x81\x85\x37\xfa\x21\x3d\x7f\x9f\x4d\x51\x58"
                ## RMB DEBUG single frame UNmasked Hello (good - don't use mask srvr-to-client)
                ## msgToSend = "\x81\x05\x48\x65\x6c\x6c\x6f" (Hello)
                ## msgToSend = "\x81\x05Hello"
                # print "SENDING", repr(msgToSend)
                #### sock.send(msgToSend)
                #### dataFromFile = f.read(4000)
            dataFromFile = f.read()
            msgToSend = encode_msg(dataFromFile)
            sock.send(msgToSend)
            print "time to send data", time.time() - startTime
        elif splitMsg[0] == "debug":
            print "debug msg recvd:", splitMsg
            msgToSend = encode_msg("howdy debug")
            sock.send(msgToSend)
        elif splitMsg[0] == "done":
            break
        else:
            print "unrecognized msg:", splitMsg
            break

    print 'closing:', addr
    clients.remove(sock)
    sock.close()

def start_server():
    sock = socket.socket()
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    sock.bind(('', PORT))
    sock.listen(1)
    while 1:
        conn, addr = sock.accept()
        print 'connection from:', addr
        clients.append(conn)
        threading.Thread(target=handle_connection,args=(conn, addr)).start()

clients = []
start_server()
