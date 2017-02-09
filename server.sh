#!/bin/bash

# Global variables
BASEDIR=$(dirname $0)
PIDFILE="server.pid"
CMD="nohup node web/server.js"

# change current dirctory
cd $BASEDIR

# test pid
SERVER_PID=0
if [ -e $PIDFILE ]; then
	let "SERVER_PID = $(cat $PIDFILE) + 0"
	if [ $SERVER_PID -gt 0 ]; then
		TESTPS=$(ps -p $SERVER_PID | grep $SERVER_PID)
		if [ -z "$TESTPS" ]; then
			SERVER_PID=0
		fi
	fi
fi

# Action definition
start() {
	if [ $SERVER_PID -gt 0 ]; then
		echo "Process already running:$SERVER_PID"
	else
		echo "Starting ..."
		$CMD >> logs/web.log &
		SERVER_PID=$!
		let "SERVER_PID = $SERVER_PID + 0"
		sleep 1
		TESTPS=$(ps -p $SERVER_PID | grep $SERVER_PID)
		if [ -n "$TESTPS" ]; then
			echo "Process started:$SERVER_PID"
			echo "$SERVER_PID" > $PIDFILE
		else
			echo "Fail to start process"
		fi
	fi
}

stop() {
	if [ $SERVER_PID -eq 0 ]; then
		echo "Process not running, nothing to stop"
	else
		kill "$SERVER_PID"
		echo "Process $SERVER_PID stopped"
		SERVER_PID=0
	fi
	rm $PIDFILE > /dev/null 2>&1
}

restart() {
	stop
	start
}

# Parse command line parameters
case $1 in
	start)
		start
		;;
	stop)
		stop
		;;
	restart)
		restart
		;;
	*)
		echo "Usage: $(basename $0) [action]"
		echo "  [action] = start | stop | restart"
		exit
		;;
esac


