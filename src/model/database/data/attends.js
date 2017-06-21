const pgp = require('pg-promise')({
    capSQL: true
});

var columnSet = new pgp.helpers.ColumnSet(
    [
        'workshop_id',
        'profile_id',
        'created_at'
    ],
    {
        table: 'attends'
    }
);
const tuples = [
    [1, 1, (+new Date(2017, 5, 17))],
    [1, 2, (+new Date(2017, 5, 15))],
    [1, 3, (+new Date(2017, 5, 14))],
    [2, 2, (+new Date(2017, 5, 16))],
    [3, 1, (+new Date(2017, 5, 11))],
    [3, 2, (+new Date(2017, 5, 10))],
    [4, 2, (+new Date(2017, 5, 11))],
    [5, 2, (+new Date(2017, 5, 13))],
    [5, 3, (+new Date(2017, 5, 18))],
    [6, 2, (+new Date(2017, 5, 14))],
    [6, 3, (+new Date(2017, 5, 14))],
    [7, 2, (+new Date(2017, 5, 14))],
];


var datas = tuples.map(([w, p, t]) => ({
    workshop_id: w,
    profile_id: p,
    created_at: t
}));

module.exports = {
    columnSet,
    datas,
};
