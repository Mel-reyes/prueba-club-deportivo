import http from "http";
import { parse } from "url";
import fs from "fs";

const port = 3000;

// Rutas de archivos
const INDEX_FILE = "index.html";
const JSON_FILE = "./deportes.json";

// Función para enviar respuestas de error
function sendError(res, statusCode, message) {
  res.writeHead(statusCode, { "Content-Type": "text/plain" });
  res.end(message);
}

// Función para enviar respuestas exitosas
function sendSuccessResponse(res, message = "Operación realizada con éxito") {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end(message);
}

// Función para manejar las solicitudes
function handleRequest(req, res) {
  const parsedUrl = parse(req.url, true); 
  const pathname = parsedUrl.pathname; 
  const query = parsedUrl.query; 

  // Manejo de la solicitud de la ruta raíz '/'
  if (pathname === "/") {
    fs.readFile(INDEX_FILE, "utf8", (err, html) => { 
      if (err) {
        sendError(res, 500, "Internal Server Error"); 
        return;
      }
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(html); 
    });
  } else if (pathname === "/agregar") { // Manejo de la solicitud para agregar datos
    const { nombre, precio } = query; 
    if (!nombre || !precio) { 
      sendError(res, 400, "Bad Request: nombre y precio son necesarios");
      return;
    }

    fs.readFile(JSON_FILE, "utf8", (err, data) => { // Lee el archivo deportes.json
      if (err) {
        sendError(res, 500, "Internal Server Error");
        return;
      }

      let jsonData = JSON.parse(data); 
      jsonData.deportes.push({ nombre, precio }); 
      fs.writeFile(JSON_FILE, JSON.stringify(jsonData, null, 1), (err) => { // Escribe el objeto modificado de nuevo en el archivo
        if (err) {
          sendError(res, 500, "Internal Server Error");
          return;
        }
        sendSuccessResponse(res); // Envía una respuesta de éxito después de agregar datos
      });
    });
  } else if (pathname === "/deportes") { // Manejo de la solicitud para obtener datos
    fs.readFile(JSON_FILE, (err, data) => { 
      if (err) {
        sendError(res, 500, "Internal Server Error");
        return;
      }
      if (!data || data.length === 0) {
        sendError(res, 404, "No data found"); 
        return;
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(data); // Envía el contenido del archivo deportes.json como respuesta
    });
  } else if (pathname === "/editar" || pathname === "/eliminar") { // Manejo de la solicitud para editar o eliminar datos
    const { nombre, precio } = query;
    if (!nombre) {
      sendError(res, 400, "Bad Request: nombre es necesario");
      return;
    }

    fs.readFile(JSON_FILE, "utf8", (err, data) => { // Lee el archivo deportes.json
      if (err) {
        sendError(res, 500, "Internal Server Error");
        return;
      }

      let jsonData = JSON.parse(data); // Convierte el contenido del archivo a un objeto JavaScript
      if (pathname === "/editar") {
        const index = jsonData.deportes.findIndex((d) => d.nombre === nombre); 
        if (index !== -1) {
          jsonData.deportes[index].precio = precio; 
        }
      } else {
        jsonData.deportes = jsonData.deportes.filter((d) => d.nombre !== nombre); 
      }

      fs.writeFile(JSON_FILE, JSON.stringify(jsonData, null, 1), (err) => { // Escribe el objeto modificado de nuevo en el archivo
        if (err) {
          sendError(res, 500, "Internal Server Error");
          return;
        }
        sendSuccessResponse(res); // Envía una respuesta de éxito después de editar o eliminar datos
      });
    });
  } else {
    sendError(res, 404, "Not Found"); // Envía un error si la ruta solicitada no se encuentra
  }
}

// Crea un servidor HTTP y lo pone a la escucha en el puerto especificado
http.createServer(handleRequest).listen(port, () => {
  console.log(`Server running on port ${port}`);
});
