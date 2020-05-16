const sql = require('mssql');
const config = require('./config-db');

const pool = new sql.ConnectionPool(config);
const conn = pool.connect();

const queryStock = `SELECT p.ProductoId productoId,
	CASE
	WHEN 
		(p.TipoUnidadMedidaId2=0) OR
		((p.TipoUnidadMedidaId2=1 OR p.TipoUnidadMedidaId2=3) AND p.UnidadMedidaId2=0) OR 
		((p.TipoUnidadMedidaId2=1 OR p.TipoUnidadMedidaId2=3) AND p.UnidadMedidaId2<>0 AND p.Packing=0) OR 	
		((p.TipoUnidadMedidaId2=2 OR p.TipoUnidadMedidaId2=4) AND (p.CantUnidadMedida1=0 OR p.Packing=0)) THEN ROUND(s.StockActual,0)
	WHEN (p.TipoUnidadMedidaId2=1 OR p.TipoUnidadMedidaId2=3) AND p.UnidadMedidaId2<>0 AND p.Packing<>0 THEN ROUND(s.StockActual / p.Packing,0)
	WHEN (p.TipoUnidadMedidaId2=2 OR p.TipoUnidadMedidaId2=4) AND p.UnidadMedidaId2=0 AND p.CantUnidadMedida1<>0 THEN ROUND(s.StockActual / p.CantUnidadMedida1,0)
	WHEN (p.TipoUnidadMedidaId2=2 OR p.TipoUnidadMedidaId2=4) AND p.UnidadMedidaId2<>0 AND p.CantUnidadMedida1<>0 AND p.Packing<>0 THEN ROUND	((s.StockActual / p.CantUnidadMedida1) / p.Packing,0)
	END stockActual
	FROM Stock s
	JOIN Productos p ON p.ProductoId=s.ProductoId
	JOIN TipoUnidadesMedida t ON t.TipoUnidadMedidaId=p.TipoUnidadMedidaId2
	JOIN UnidadesMedida u ON u.TipoUnidadMedidaId=t.TipoUnidadMedidaId AND u.UnidadMedidaId=p.UnidadMedidaId2
	WHERE s.DepositoId = @input_parameter`;

exports.getData = function getData(depositoId) {
    return conn.then(conexion => {
        let resumenClientes;

        return conexion.request()
            .input('input_parameter', sql.Int, depositoId)
            .query(queryStock)
            .then( result => {
                resumenClientes = result.recordset;

                return resumenClientes;
            })
            .catch(err => {
                return err;
            });

    }).catch((err) => {
        console.log(err);
    });;
}

