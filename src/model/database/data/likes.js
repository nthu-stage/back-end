const pgp = require('pg-promise')({
    capSQL: true
});

var columnSet = new pgp.helpers.ColumnSet(
    [
        'idea_id',
        'profile_id',
        'created_at'
    ],
    {
        table: 'likes'
    }
);

const tuples = [
    [1, 1, (+new Date(2017, 5, 17))],
    [1, 2, (+new Date(2017, 5, 14))],
    [1, 3, (+new Date(2017, 5, 16))],
    [2, 1, (+new Date(2017, 5, 19))],
    [2, 3, (+new Date(2017, 5, 18))],
    [3, 2, (+new Date(2017, 5, 11))],
    [5, 1, (+new Date(2017, 5, 15))],
    [5, 2, (+new Date(2017, 5, 15))],
    [5, 3, (+new Date(2017, 5, 15))],
    [6, 1, (+new Date(2017, 5, 16))],
    [8, 3, (+new Date(2017, 5, 17))],
    [8, 2, (+new Date(2017, 5, 18))],
];

var datas = tuples.map(([i, p, t]) => ({
    idea_id: i,
    profile_id: p,
    created_at: t
}));

module.exports = {
    columnSet,
    datas,
};
