const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors()); // Permite que React (puerto 5173) pida datos aquí
app.use(express.json());

// Ruta para obtener las recetas
app.get('/api/recipes', (req, res) => {
  const dataPath = path.join(__dirname, 'recipes.json');
  fs.readFile(dataPath, 'utf8', (err, data) => {
    if (err) {
      console.error("Error leyendo DB:", err);
      return res.status(500).json({ error: 'Error interno' });
    }
    try {
        const jsonData = JSON.parse(data);
        res.json(jsonData);
    } catch (parseError) {
        console.error("Error parseando JSON:", parseError);
        res.status(500).json({ error: 'Error en formato de datos' });
    }
  });
});

app.listen(PORT, () => {
  console.log(`Backend de recetas escuchando en http://localhost:${PORT}`);
});