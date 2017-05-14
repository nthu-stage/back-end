require('../config.js');
const express = require('express');

// const postRouter = require('./routers/posts.js');
const workshopRouter = require('./routers/workshops.js');
const profileRouter = require('./routers/profiles.js');
const ideaRouter = require('./routers/ideas.js');
// const requestLogger = require('./middleware/request-logger.js');
const fbChecker = require('./middleware/fb-checker.js');
const errorHandler = require('./middleware/error-handler.js');

const app = express();

// app.use(requestLogger); // debug only
app.use(fbChecker);
// app.use(express.static('dist', {
//     setHeaders: (res, path, stat) => {
//         res.set('Cache-Control', 'public, s-maxage=86400');
//     }
// }));
// app.use('/api', postRouter);
app.use('/api', workshopRouter);
app.use('/api', profileRouter);
app.use('/api', ideaRouter);
app.get('/*', (req, res) => res.redirect('/'));
app.use(errorHandler);

const port = 3000;
app.listen(port, () => {
    console.log(`Server is up and running on port ${port}...`);
});
