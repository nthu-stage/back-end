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
        web_url: 'https://www.wikiwand.com/zh-tw/%E4%B8%96%E7%B4%80%E5%B8%9D%E5%9C%8B%E7%B3%BB%E5%88%97',
        image_url: 'https://upload.wikimedia.org/wikipedia/commons/c/cf/Aoe_fuchs.png?1498058253204',
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
        idea_type: 'teach',
        skill: '圍棋',
        goal: '打贏AlphaGo',
        web_url: 'https://www.wikiwand.com/en/Go_(game)',
        image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/FloorGoban.JPG/800px-FloorGoban.JPG?1498057833045',
        created_at: (+ new Date(2017, 5, 15)),
        updated_at: (+ new Date(2017, 5, 18)),
    },
    {
        idea_type: 'learn',
        skill: 'RoR',
        goal: '開發資料庫網站應用程式',
        web_url: 'http://rubyonrails.org/',
        image_url: 'http://www.macos.utah.edu/documentation/servers/ruby_on_rails_apps_on_macosx_10-5_server/mainColumnParagraphs/00/image/ruby-on-rails.jpg',
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
        skill: '哲學與人生',
        goal: '由哲學角度省思人生問題',
        web_url: 'http://ocw.aca.ntu.edu.tw/ntu-ocw/ocw/cou/104S103',
        image_url: 'http://ocw.aca.ntu.edu.tw/ntu-ocw/files/110px/104S103.jpg',
        created_at: (+ new Date(2017, 5, 15)),
        updated_at: (+ new Date(2017, 5, 18)),
    },
    {
        idea_type: 'learn',
        skill: '留學',
        goal: '開闊眼界和經驗',
        web_url: 'http://big5.eastday.com:82/gate/big5/imgtianqi.eastday.com/res/upload/ueditor/php/upload/image/20161205/1480903043808785.png',
        image_url: 'http://big5.eastday.com:82/gate/big5/imgtianqi.eastday.com/res/upload/ueditor/php/upload/image/20161205/1480903043808785.png',
        created_at: (+ new Date(2017, 5, 20)),
        updated_at: (+ new Date(2017, 5, 20)),
    },
    {
        idea_type: 'learn',
        skill: '吉他',
        goal: '彈吉他',
        web_url: 'https://www.wikiwand.com/zh/%E5%90%89%E4%BB%96',
        image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Guitar_1.jpg/640px-Guitar_1.jpg?1498058134658',
        created_at: (+ new Date(2017, 5, 11)),
        updated_at: (+ new Date(2017, 5, 11)),
    }
];

module.exports = {
    columnSet,
    datas,
};
