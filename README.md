############ README ###################################
1.1 Software Purpose
1.2 Files
1.3 Dependencies
1.4 Installation


1.1 Software Purpose:
    This is a simplifThe Cloud Computing directory has several files necessary to effectuate the
    cloud computing.  First note that there is a loginServer.sh bash script that
    will allow you to login, via use of public/private key encryption, the
    respective servers by choosing ssh1 or ssh2 at the prompt.  In addition, files
    can be uploaded or downloaded from the respective Linode servers by using the
    sftp1/sftp2 options.
    ied cloud computing project expecting two servers and a host client system.
    There is a GUI front end to the project that can be run with the index.html file in any 
    browser. Alternatively, the index.html file can be hosted on a webserver. 

1.2 Files:


    The Cloud Computing directory has several files necessary to effectuate the
    cloud computing.  First note that there is a loginServer.sh bash script that
    will allow you to login, via use of public/private key encryption, the
    respective servers by choosing ssh1 or ssh2 at the prompt.  In addition, files
    can be uploaded or downloaded from the respective Linode servers by using the
    sftp1/sftp2 options. This script may be changed to include the IP addresses of
    whatever servers are being used. ssh-copy-id was used to copy over the public key 
    from the system used. 

    There is a makefile which should be run if permissions or node modules are
    absent. The server1.js and server2.js files should be run on servers with node and 
    npm installed. Index.js can be run via any webbrowser, or set up on a server. 
    Firefox or Chrome will suffice for a web browser. 
    A command line argument can be run as such:

    firefox index.html

    Which will create an instance of that html file running in the browser. Before any 
    work can be done, both servers.js files need to be started on their respective servers, in 
    sequential order. Server2 expects server1 to be runnning. Run ./server1.js on server one and 
    ./server2.js on server two. 

    Github is setup on all machines. Any changes to the files are pushed to the repo and 
    then pulled to the other systems manually using the normal commands. 

1.3 Software Dependencies:
    Debian based OS
    Git
    Openssh
    Nodejs
    Npm
    simple-json-db

1.4 Installation: 

    Git pull repo to client and both servers. 
    Run the makefile.
    Modify server1.js and server2.js on line 3 to reflect IP address and port of
    servers you want to use in the cloud. Note that
    each server references the other server in the cloud.  
    Modify websocket.js to include servers you specifed in server1 and server2. websocket.js will randomly choose a server from the two listed when the page is loaded.  
