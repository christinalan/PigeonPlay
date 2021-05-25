let express = require("express");
let app = express();

app.use("/", express.static("public"));

let http = require("http");
let server = http.createServer(app);
let port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log("server is listening at port: " + port);
});

let io = require("socket.io")();
io.listen(server);
