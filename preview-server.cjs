const http = require("http");
const fs = require("fs");
const path = require("path");

const root = process.cwd();
const port = 4173;
const types = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
};

http.createServer((request, response) => {
    const url = new URL(request.url, `http://127.0.0.1:${port}`);
    let pathname = decodeURIComponent(url.pathname);
    if (pathname === "/") pathname = "/index.html";

    const file = path.normalize(path.join(root, pathname));
    if (!file.startsWith(root)) {
        response.writeHead(403);
        response.end("Forbidden");
        return;
    }

    fs.readFile(file, (error, data) => {
        if (error) {
            response.writeHead(404);
            response.end("Not found");
            return;
        }

        response.writeHead(200, {
            "Content-Type": types[path.extname(file).toLowerCase()] || "application/octet-stream",
        });
        response.end(data);
    });
}).listen(port, "127.0.0.1", () => {
    console.log(`Portfolio preview running at http://127.0.0.1:${port}/`);
});
