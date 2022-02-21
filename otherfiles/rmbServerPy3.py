#!/usr/bin/env python3.8

import time

import asyncio
import websockets

async def handle_connection(ws,path):
    while True:
        try:
            charMsg = await ws.recv()
        except:
            charMsg = None
        print("recvd:",charMsg)
        if charMsg == "hello":
            await ws.send("hello human")
        elif charMsg == "name":
            await ws.send("I don't have a name")
        elif charMsg == "age":
            await ws.send("I'm old")
        elif charMsg == "date":
            await ws.send("date and time is " +  time.asctime() )
        elif charMsg == "time":
            await ws.send("date and time is " + time.asctime() )
        elif charMsg == "thanks":
            await ws.send("you're welcome");
        elif charMsg == "bye":
            await ws.send("have a nice day");
        else:
            await ws.send("I don't understand");
        print("replied to",charMsg)

start_server = websockets.serve(handle_connection, 'www.cs.mtsu.edu', 5995)
# start_server = websockets.serve(handle_connection, 'localhost', 5995)

asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()

print("SERVER ENDING")
