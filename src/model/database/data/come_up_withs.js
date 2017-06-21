const pgp = require('pg-promise')({
    capSQL: true
});

var columnSet = new pgp.helpers.ColumnSet(
    [
        'idea_id',
        'profile_id'
    ],
    {
        table: 'come_up_withs'
    }
);

const pairs = [
    [1,  1],
    [2,  2],
    [3,  3],
    [4,  1],
    [5,  1],
    [6,  3],
    [7,  2],
    [8,  3],
    [9,  3],
    [10, 1],
];

var datas = pairs.map(([i, p]) => ({
    idea_id: i,
    profile_id: p
}));

module.exports = {
    columnSet,
    datas,
};
