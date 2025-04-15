const express = require('express');
const XLSX = require('xlsx');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static('.'));

app.post('/api/actualizarMesa', (req, res) => {
    const { mesaId, ...datos } = req.body;
    
    try {
        const filePath = path.join(__dirname, 'Datos', 'mesas.xlsx');
        const workbook = XLSX.readFile(filePath);
        const worksheet = workbook.Sheets['Mesas'];
        
        const mesas = XLSX.utils.sheet_to_json(worksheet);
        const mesaIndex = mesas.findIndex(m => m.id === parseInt(mesaId));
        
        if (mesaIndex !== -1) {
            mesas[mesaIndex] = { ...mesas[mesaIndex], ...datos };
            
            const newWorksheet = XLSX.utils.json_to_sheet(mesas);
            workbook.Sheets['Mesas'] = newWorksheet;
            
            XLSX.writeFile(workbook, filePath);
            
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'Mesa no encontrada' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar la mesa' });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});
