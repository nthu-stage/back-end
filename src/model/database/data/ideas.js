const pgp = require('pg-promise')({
    capSQL: true
});

var columnSet = new pgp.helpers.ColumnSet(
    [
        'idea_type',
        'skill',
        'goal',
        'web_url',
        'image_url',
        'created_at',
        'updated_at',
    ],
    {
        table: 'ideas'
    }
);

var datas = [
    {
        idea_type: 'teach',
        skill: '攝影',
        goal: '隨時拿起手機紀錄身邊的美好的事物',
        web_url: 'http://terry92516.wixsite.com/terrylinphoto',
        image_url: 'http://i.imgur.com/8KfJCHZ.jpg',
        created_at: (+ new Date(2017, 5, 13)),
        updated_at: (+ new Date(2017, 5, 23)),
    },
    {
        idea_type: 'teach',
        skill: '打世紀帝國',
        goal: '在 10 分鐘內秒殺敵人',
        web_url: '',
        image_url: 'https://images.duckduckgo.com/iu/?u=https%3A%2F%2Ftse3.mm.bing.net%2Fth%3Fid%3DOIP.tRBnI-KerLAkNIMN5phRbwEsEs%26pid%3D15.1&f=1',
        created_at: (+ new Date(2017, 5, 18)),
        updated_at: (+ new Date(2017, 5, 19)),
    },
    {
        idea_type: 'learn',
        skill: 'React',
        goal: '了解 Reactive 程式設計模式',
        web_url: 'http://www.sharecourse.net/sharecourse/course/view/courseInfo/908',
        image_url: 'http://www.sharecourse.net/sharecourse/upload/person/6/iTzrv58JKhXTdEaX6UxxdMhn.jpg',
        created_at: (+ new Date(2017, 5, 10)),
        updated_at: (+ new Date(2017, 5, 18)),
    },
    {
        idea_type: 'learn',
        skill: '肯德基爺爺',
        goal: '是個夢想家及實踐者，為自己夢想全力以赴吧！',
        web_url: 'http://www.kfcclub.com.tw/AboutKFC.html',
        image_url: 'http://www.kfcclub.com.tw/Iimages/Hr/ht-3.jpg',
        created_at: (+ new Date(2017, 5, 15)),
        updated_at: (+ new Date(2017, 5, 18)),
    },
    {
        idea_type: 'learn',
        skill: 'RoR',
        goal: '開發資料庫網站應用程式',
        web_url: 'http://rubyonrails.org/',
        image_url: 'image_url',
        created_at: (+ new Date(2017, 5, 15)),
        updated_at: (+ new Date(2017, 5, 18)),
    },
    {
        idea_type: 'learn',
        skill: '邏輯',
        goal: '若 P 則 Q ；若 非Q 則 非P',
        web_url: 'http://ocw.aca.ntu.edu.tw/ntu-ocw/ocw/cou/100S105',
        image_url: 'http://ocw.aca.ntu.edu.tw/ntu-ocw/files/110px/100S105.jpg',
        created_at: (+ new Date(2017, 5, 15)),
        updated_at: (+ new Date(2017, 5, 18)),
    },
    {
        idea_type: 'teach',
        skill: '計算機概論',
        goal: '教授計算機科學的基礎技術及知識',
        web_url: 'http://ocw.aca.ntu.edu.tw/ntu-ocw/ocw/cou/101S210',
        image_url: 'http://ocw.aca.ntu.edu.tw/ntu-ocw/files/110px/101S210.jpg',
        created_at: (+ new Date(2017, 5, 15)),
        updated_at: (+ new Date(2017, 5, 18)),
    },
    {
        idea_type: 'teach',
        skill: '哲學與人生',
        goal: '由哲學角度省思人生問題',
        web_url: 'http://ocw.aca.ntu.edu.tw/ntu-ocw/ocw/cou/104S103',
        image_url: 'http://ocw.aca.ntu.edu.tw/ntu-ocw/files/110px/104S103.jpg',
        created_at: (+ new Date(2017, 5, 15)),
        updated_at: (+ new Date(2017, 5, 18)),
    },
    {
        idea_type: 'learn',
        skill: '怎麼訂雞雞叫',
        goal: '每天都可以叫雞雞叫外送',
        web_url: '',
        image_url: '',
        created_at: (+ new Date(2017, 5, 21, 0, 14, 13)),
        updated_at: (+ new Date(2017, 5, 21, 0, 14, 13)),
    },
    {
        idea_type: 'learn',
        skill: '留學',
        goal: '開闊眼界和經驗',
        web_url: '',
        image_url: '',
        created_at: (+ new Date(2017, 5, 20)),
        updated_at: (+ new Date(2017, 5, 20)),
    },
];

module.exports = {
    columnSet,
    datas,
};
