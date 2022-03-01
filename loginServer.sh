#!/bin/bash
echo -n "ssh1/ssh2 or sftp1/sftp2?: "
read arg

case $arg in
    sftp1)
        sftp root@139.177.205.73
        ;;
    sftp2)
        sftp root@45.33.96.41
        ;;
    ssh1)
        ssh root@139.177.205.73
        ;;
    ssh2)
        ssh root@45.33.96.41
        ;;
esac
