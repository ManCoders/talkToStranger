const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

const fs = require("fs");
const path = require("path");

const messagesFilePath = path.join(__dirname, "chat_messages", "messages.json");
const MAX_MESSAGES = 5;

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

io.on("connection", (socket) => {
  console.log("a user connected " + socket.id);

  socket.on("disconnect", () => {
    console.log("user disconnected" + socket.id);
  });

  socket.on("chat message", (msg) => {
    const timestamp = new Date().toISOString(); // Get current time
    const messageWithTimestamp = { timestamp, message: msg };

    let existingMessages = [];
    try {
      existingMessages = require(messagesFilePath);
    } catch (err) {
      console.error("Error reading messages file:", err);
    }

    existingMessages.push(messageWithTimestamp);

    fs.writeFile(
      messagesFilePath,
      JSON.stringify(existingMessages, null, 2),
      (err) => {
        if (err) {
          console.error("Error writing message to file:", err);
        } else {
          console.log("Message written to file:", messageWithTimestamp.message);
          io.emit("chat message", messageWithTimestamp.message); 
        }
      }
    );

    socket.on("chat message", (msg) => {
      const timestamp = new Date().toISOString();
      const message = { timestamp, message: msg };

      readMessagesFromFile((messages) => {
        messages.push(message);
        
        writeMessagesToFile(messages, () => {
          io.emit("chat message", message); 
        });
      });
    });

    socket.on("reset messages", () => {
      writeMessagesToFile([], () => {
        io.emit("reset messages");
      });
    });

    /*  fs.readFile(messagesFilePath, 'utf8', (err, data) => {
            if (err) {
                console.error('Error reading messages file:', err);
            } else {
                try {
                    const messages = JSON.parse(data);
                    messages.forEach((msg) => {
                        socket.emit('chat message', msg.message);
                    });
                } catch (parseError) {
                    console.error('Error parsing messages JSON:', parseError);
                }
            }
        });
 */
  });
});

http.listen(3000, () => {
  console.log("listening on http://localhost:3000");
});
