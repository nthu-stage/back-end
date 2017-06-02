const fs = require('fs');
const moment = require('moment');

module.exports = function(err, req, res, next) {
    console.error(err);

    const log = `${moment().unix()} ERROR  ${err.stack}\n`;
    fs.appendFile('logs.txt', log, (err) => {
        if (err) console.error(err);
    });

    const status = err.status || 500;
    const status_code = (status==200) ? 'OK'
					  : (status==400) ? 'Bad Request'
					  : (status==401) ? 'Unauthorized'
					  : /* default */   'Internal Server Error';
    var msg = [
	    status_code,
		err,
		JSON.stringify(err),
		Error().stack
	];
	console.log(msg.join('\n'));

    // TODO: remove this when production, security reason
	res.status(status).send(msg.join('\n'));

    // res.sendStatus(err.status ? err.status : 500);
    // next(err);
};
