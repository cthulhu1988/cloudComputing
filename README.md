############ README ###################################

The Cloud Computing directory has several files necessary to effectuate the cloud computing. 
First note that there is a loginServer.sh bash script that will allow you to login, via
use of public/private key encryption, the respective servers by choosing ssh1 or ssh2 at the prompt. 
In addition, files can be uploaded or downloaded from the respective Linode servers by using the 
sftp1/sftp2 options.

There is a makefile which should be run if permissions or node modules are
absent. The server1.js and server2.js files should be run on servers with node and 
npm installed. Index.js can be run via any webbrowser. Firefox or Chrome will
suffice. A command line argument can be run as such:

firefox index.html

Which will create an instance of that html file running in the browser. Before any 
work can be done, both servers need to be started on their respective servers, in 
sequential order. Server2 expects server1 to be runnning.

Github is setup on all machines. Any changes to the files are pushed to the repo and 
then pulled to the other systems. 

