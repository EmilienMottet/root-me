require 'socket'        # Sockets are in standard library

hostname = 'challenge01.root-me.org'
port = 52017

s = TCPSocket.open(hostname, port)

while line = s.gets     # Read lines from the socket
  puts line.chop       # And print with platform line terminator
end
s.close                 # Close the socket when done
