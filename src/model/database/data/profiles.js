const pgp = require('pg-promise')({
    capSQL: true
});

var columnSet = new pgp.helpers.ColumnSet(
    [
        'name',
        'email',
        'fb_userid',
        'access_token',
        'picture_url',
        'created_at',
        'available_time'
    ],
    {
        table: 'profiles'
    }
);

var datas = [
    {
        name: '張嘉軒',
        email: 'ookk8282@gmail.com',
        fb_userid: 1514864711922034,
        picture_url: 'https://scontent.xx.fbcdn.net/v/t1.0-1/p200x200/16426235_1335337256541448_4112461475677668738_n.jpg?oh=9c56d493b030d5579e42943462741ace&oe=59D5AB64',
        created_at: (+ new Date(2017, 4, 25))
    }, {
        name: '賴詰凱',
        email: 'skyle0115@gmail.com',
        fb_userid: '1833867746937550',
        picture_url: 'https://scontent.xx.fbcdn.net/v/t1.0-1/p200x200/18622427_1859238271067164_3869120362467491071_n.jpg?oh=681ac9d57e2917e97ce9d25f027b76d4&oe=59D96830',
        created_at: (+ new Date(2017, 5, 3))
    }, {
        name: '林軒毅',
        email: 'a7633082@yahoo.com.tw',
        fb_userid: '1194279457367537',
        picture_url: 'https://scontent.xx.fbcdn.net/v/t1.0-1/p200x200/18222362_1188800274582122_8342935289938813421_n.jpg?oh=f17f6c5f8e4224a896c04bfb60695c7e&oe=59D56634',
        created_at: (+ new Date(2017, 5, 19))
    }, {
        name: 'Charlie Liu',
        email: 'charlie4182@gmail.com',
        fb_userid: '1526609924078475',
        picture_url: 'https://scontent.xx.fbcdn.net/v/t1.0-1/p200x200/11048713_850040835068724_5757188957546843445_n.jpg?oh=e8672b728fd1300cb65a2dc4dce6113d&oe=59DB35EB',
        created_at: (+ new Date(2017, 5, 21))
    }
];

function genRandomAvaiTime() {
    var available_time = new Array(21);
    for (let i=0; i<21; i++) {
        available_time[i] = Math.random() < 0.5;
    }
    return JSON.stringify(available_time);
}

for (let p of datas) {
    p.available_time = genRandomAvaiTime();
    p.access_token = process.env[`ACCESS_TOKEN_${p.fb_userid}`];
}

module.exports = {
    columnSet,
    datas,
};
