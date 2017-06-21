const pgp = require('pg-promise')({
    capSQL: true
});

var columnSet = new pgp.helpers.ColumnSet(
    [
        'workshop_id',
        'profile_id'
    ],
    {
        table: 'proposes'
    }
);

const pairs = [
    [1, 2],
    [2, 3],
    [3, 1],
    [4, 3],
    [5, 1],
    [6, 2],
    [7, 2],
];

var datas = pairs.map(([w, p]) => ({
    workshop_id: w,
    profile_id: p
}));

module.exports = {
    columnSet,
    datas,
};
