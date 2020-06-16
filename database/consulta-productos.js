const sql = require('mssql');
const config = require('./config-db');

const pool = new sql.ConnectionPool(config);
const conn = pool.connect();

const queryStock = `SELECT r.ListaPrecioId listaPrecioId, p.ProductoId productoId, p.Descripcion descProducto, ROUND(r.Precio * (1 + (p.IVA/100)),2) precio
                FROM RelProductosListasPrecios r
                JOIN Productos p ON p.ProductoId=r.ProductoId
                JOIN RelProductosClasificacionesProductos rpcp ON rpcp.ProductoId = p.ProductoId
                WHERE rpcp.ClasificacionProdId = 293 AND r.ListaPrecioId = @input_parameter
                UNION
                SELECT 1 listaPrecioId, '836' productoId, 'Promo Tarta' descProducto, 
                    SUM(CASE
                        WHEN p.ProductoId = '146' THEN ROUND((r.Precio * (1 + (p.IVA/100))) * 0.300, 2)
                        WHEN p.ProductoId = '835' THEN ROUND((r.Precio * (1 + (p.IVA/100))) * 0.500, 2)
                        WHEN p.ProductoId = '836' THEN ROUND((r.Precio * (1 + (p.IVA/100))), 2)
                    END) precio
                FROM RelProductosListasPrecios r
                JOIN Productos p ON p.ProductoId=r.ProductoId
                WHERE r.ProductoId IN ('146','835','836') AND r.ListaPrecioId = @input_parameter
                UNION
                SELECT 1 listaPrecioId, '842' productoId, 'Promo Dia de la Bandera' descProducto,
                    SUM(CASE
                        WHEN p.ProductoId = '7798056680033' THEN ROUND((r.Precio * (1 + (p.IVA/100))) * 1, 0)
                        WHEN p.ProductoId = '206' THEN ROUND((r.Precio * (1 + (p.IVA/100))) * 0.305, 0)
                    END) precio
                FROM RelProductosListasPrecios r
                JOIN Productos p ON p.ProductoId=r.ProductoId
                WHERE r.ProductoId IN ('7798056680033','206') AND r.ListaPrecioId = @input_parameter
                UNION
                SELECT 1 listaPrecioId, '843' productoId, 'Promo Invierno' descProducto,
                    SUM(CASE
                        WHEN p.ProductoId = '7798056680361' THEN ROUND((r.Precio * (1 + (p.IVA/100))) * 1, 1)
                        WHEN p.ProductoId = '843' THEN ROUND((r.Precio * (1 + (p.IVA/100))) * 0.155, 1)
                    END) precio
                FROM RelProductosListasPrecios r
                JOIN Productos p ON p.ProductoId=r.ProductoId
                WHERE r.ProductoId IN ('7798056680361','843') AND r.ListaPrecioId = @input_parameter
                UNION
                SELECT 1 listaPrecioId, '844' productoId, 'Promo Jamon' descProducto,
                    SUM(CASE
                        WHEN p.ProductoId = '809' THEN ROUND((r.Precio * (1 + (p.IVA/100))) * 0.250, 2)
                        WHEN p.ProductoId = '844' THEN ROUND((r.Precio * (1 + (p.IVA/100))) * 0.200, 2)        
                    END) precio
                FROM RelProductosListasPrecios r
                JOIN Productos p ON p.ProductoId=r.ProductoId
                WHERE r.ProductoId IN ('809','844') AND r.ListaPrecioId = @input_parameter
                UNION
                SELECT 1 listaPrecioId, '845' productoId, 'Promo Salame' descProducto,
                    SUM(CASE
                        WHEN p.ProductoId = '809' THEN ROUND((r.Precio * (1 + (p.IVA/100))) * 0.250, 2)
                        WHEN p.ProductoId = '845' THEN ROUND((r.Precio * (1 + (p.IVA/100))) * 0.150, 2)        
                    END) precio
                FROM RelProductosListasPrecios r
                JOIN Productos p ON p.ProductoId=r.ProductoId
                WHERE r.ProductoId IN ('809','845') AND r.ListaPrecioId = @input_parameter
                UNION
                SELECT 1 listaPrecioId, '846' productoId, 'Promo Dia del Padre' descProducto,
                    SUM(CASE
                        WHEN p.ProductoId = '7797283005497' THEN ROUND((r.Precio * (1 + (p.IVA/100))) * 1, 2)
                        WHEN p.ProductoId = '841' THEN ROUND((r.Precio * (1 + (p.IVA/100))) * 0.200, 2)
                        WHEN p.ProductoId = '846' THEN ROUND((r.Precio * (1 + (p.IVA/100))) * 0.500, 2)
                    END) precio
                FROM RelProductosListasPrecios r
                JOIN Productos p ON p.ProductoId=r.ProductoId
                WHERE r.ProductoId IN ('7797283005497','841','846') AND r.ListaPrecioId = @input_parameter
                UNION
                SELECT 1 listaPrecioId, p.ProductoId productoId, 'Promo Picnic' descProducto, ROUND((r.Precio/2) * (1 + (p.IVA/100)),2) precio
                FROM RelProductosListasPrecios r
                JOIN Productos p ON p.ProductoId=r.ProductoId
                WHERE r.ProductoId='854' AND r.ListaPrecioId = @input_parameter`;

exports.getData = function getData(listaPrecioId) {
    return conn.then(conexion => {
        let listaPrecios;

        return conexion.request()
            .input('input_parameter', sql.Int, listaPrecioId)
            .query(queryStock)
            .then( result => {
                listaPrecios = result.recordset;

                return listaPrecios;
            })
            .catch(err => {
                return err;
            });

    }).catch((err) => {
        console.log(err);
    });;
}

