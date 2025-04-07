CREATE DATABASE IF NOT EXISTS restaurante_db;
USE restaurante_db;

-- Tabla para los platos del menú
CREATE TABLE platos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL,
    imagen_url VARCHAR(255),
    categoria VARCHAR(50),
    activo BOOLEAN DEFAULT true
);

-- Tabla para las mesas
CREATE TABLE mesas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero INT NOT NULL,
    capacidad INT NOT NULL,
    estado ENUM('disponible', 'ocupada', 'reservada') DEFAULT 'disponible'
);

-- Tabla para las reservas
CREATE TABLE reservas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mesa_id INT,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    estado ENUM('pendiente', 'confirmada', 'cancelada') DEFAULT 'pendiente',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mesa_id) REFERENCES mesas(id)
);

-- Insertar los platos del menú
INSERT INTO platos (nombre, descripcion, precio, imagen_url) VALUES
('Ceviche Clásico', 'Pescado fresco marinado en limón con ají y cilantro. Servido con camote y choclo', 35.00, 'https://media.a24.com/p/5534bfffca6ddf35246308865bdcd189/adjuntos/296/imagenes/009/138/0009138416/1200x675/smart/ceviche-receta-casera-un-manjar-peruano-tu-mesa.png'),
('Lomo Saltado', 'Tradicional salteado de res con verduras y papas fritas', 42.00, 'https://static.wixstatic.com/media/9755d8_b2d98eade0814b17a67fdf7d95888fdc~mv2.png'),
('Ají de Gallina', 'Cremosa preparación de pollo en salsa de ají amarillo', 38.00, 'https://www.comidaperuana.co/images/post/post-2-3.png'),
('Chupe de Camarones', 'Sopa cremosa con camarones, maíz, queso y huevo', 45.00, 'https://www.paulinacocina.net/wp-content/uploads/2024/03/chupe-de-camaron-Paulina-Cocina-Recetas-Cocina-Recetas-1-1722430347-1200x675.jpg'),
('Arroz con Mariscos', 'Arroz al ají panca con variedad de mariscos frescos', 48.00, 'https://www.recetasnestle.com.pe/sites/default/files/srh_recipes/983b3beba61893c89be5456219d45451.jpg'),
('Rocoto Relleno', 'Rocoto relleno de carne, pasas y queso gratinado', 36.00, 'https://www.paulinacocina.net/wp-content/uploads/2024/04/rocoto-relleno-con-pastel-de-papa-Paulina-Cocina-Recetas-Cocina-Recetas-1722430349-1200x900.jpg'),
('Causa Rellena', 'Papa amarilla prensada rellena de pollo o atún', 32.00, 'https://www.infobae.com/resizer/v2/PKTJOMTL4NEKZPOSQZVJ5TNYGE.jpg'),
('Anticuchos', 'Brochetas de corazón marinadas en ají panca', 28.00, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQy6fsllnHMaw7dYA0F75SWpLJGDegDcEPKbw&s'),
('Tacu Tacu', 'Tortilla de arroz y frejoles con bistec a lo pobre', 40.00, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQcZONGC-lvqht7Q6M6A7Me_aBCEwxItIlH0Q&s');

-- Insertar las mesas disponibles
INSERT INTO mesas (numero, capacidad) VALUES
(1, 4),
(2, 6),
(3, 2),
(4, 4),
(5, 8),
(6, 2);



SELECT * FROM platos;
SELECT * FROM mesas;
