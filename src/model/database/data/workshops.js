const pgp = require('pg-promise')({
    capSQL: true
});

var columnSet = new pgp.helpers.ColumnSet(
    [
        'image_url',
        'title',
        'location',
        'introduction',
        'content',
        'min_number',
        'max_number',
        'price',
        'state',
        'start_datetime',
        'end_datetime',
        'deadline',
        'pre_deadline',
        'created_at',
        'updated_at'
    ],
    {
        table: 'workshops'
    }
);

var datas = [
    {
        image_url: 'https://az796311.vo.msecnd.net/userupload/1641e800c60347a8b36f499ee00e33b3.jpg',
        title: 'Scrum軟體開發',
        location: '大人學台北教室',
        introduction: '本課程將透過動手的方式，來教會大家如何使用 Scrum。從實作中交流實施 Scrum 所需注意的事項，常見的問題，以及解決方法。',
        content: '這幾年，大家恐怕都有聽到別人在提Scrum手法。 或許你打算在團隊中導入，但不知道從何著手。 甚至你可能已經嘗試導入過，但碰到很多問題。 若以上符合你的狀況，那你該來參加這堂課。 了解一下書上看起來很容易的部分，到底實務上該怎麼進行，才能真正解決問題，並幫組織產生價值。 坊間補習班推廣證照或是工具時，文宣總是過度強調單一方法的萬能性。 但這世界沒有甚麼神奇的銀彈，每個方法都有其限制，也有在導入過程中的重要「眉角」。 所以理解方法的邊界，你才能正確選擇對的方法，並正確聚焦團隊。 ',
        min_number: 30,
        max_number: 50,
        price: 4780,
        state: 'judge_ac',
        start_datetime: (+ new Date(2017, 6, 25, 10)),
        end_datetime:   (+ new Date(2017, 6, 25, 17)),
        deadline:       (+ new Date(2017, 5, 23)),
        pre_deadline:   (+ new Date(2017, 5, 23)),
        created_at:     (+ new Date(2017, 2, 7)),
        updated_at:     (+ new Date(2017, 2, 7))
    },
    {
        image_url : 'https://az796311.vo.msecnd.net/userupload/645dc9d5647c4e2ca3b09297bc440f1c.jpg',
        title: '輕鬆上手機器學習',
        location:'三創生活園區',
        introduction: 'R語言、機器學習、物聯網，資料科學離你不遙遠，\n從概念上手到實務操作，化為創業路上的最佳利器。',
        content: '資料分析及機器學習近年來成為熱門的議題。透過短短兩次的課程讓你對此議題能有初步了解。本次活動提供互動式的視覺化介面，拖拉的方式讓使用者輕鬆建置、測試和反覆運算預測分析模型，而完成的預測分析模型也可直接發佈成 Web 服務或自訂 BI 工具 (例如 Excel)，讓其他人也都可以存取您的模型。本次課程將由淺入深介紹Azure Machine Learning工具，也會透過實作的方式，使每個參加者都可以完成自己的第一個機器學習預測模型！',
        min_number: 20,
        max_number: 40,
        price: 50,
        state: 'judge_ac',
        start_datetime: (+ new Date(2017, 5, 21, 19)),
        end_datetime:   (+ new Date(2017, 5, 21, 22)),
        deadline:       (+ new Date(2017, 5, 21)),
        pre_deadline:   (+ new Date(2017, 5, 21)),
        created_at:     (+ new Date(2017, 4, 15)),
        updated_at:     (+ new Date(2017, 4, 15))
    },
    {
        image_url: 'https://az796311.vo.msecnd.net/userupload/69cf1a464abc454483c825a49481f4ff.jpg',
        title: '科學傳播創新實作營',
        location: '台北文創',
        introduction: '你看過『侏儸紀公園』、『瓦力』、『美麗境界』或『星際過客』這些經典電影嗎？\n它們都是『科學傳播』的一環，透過生動、有趣的方式傳遞科學概念、原理、想像。',
        content: '全國唯一整合大學師資、業界專家、教育顧問資源的營隊\n\n營隊師資包含大學教授、科普部落客、知名直播客\n\n「知識」與「實作」並重的內容，學習專業知識更有樂趣\n\n融入生活與產業的趨勢，實作活動絕對有助於未來的升學\n\n實作與競賽全程以 Gopro 紀錄影像，留下珍貴的互動回憶',
        min_number: 20,
        max_number: 50,
        price: 3980,
        state: 'judge_ac',
        start_datetime: (+ new Date(2017, 7, 4)),
        end_datetime:   (+ new Date(2017, 7, 5)),
        deadline:       (+ new Date(2017, 7, 2)),
        pre_deadline:   (+ new Date(2017, 7, 2)),
        created_at:     (+ new Date(2017, 5, 17)),
        updated_at:     (+ new Date(2017, 5, 17))
    },
    {
        image_url: 'https://az796311.vo.msecnd.net/userupload/5c7acacc42b0479b98d7d3f70329ae2e.jpg',
        title: '鐵粉經濟學',
        location: '天地人文創',
        introduction: '社群是個驚人的經濟體，如何讓社群平台裡的粉絲轉變成鐵粉？如何讓產品一PO文就大賣？如何透過社群經營與內容行銷打造鐵粉經濟學？',
        content: '社群經營是一門學問，從發文頻率、時間、圖文風格，都是攸關著一個社群經營得好壞的重要因素，也決定了粉絲們的去留，因此社群內的內容也就變得相當重要，有價值且被消費者需要的內容，將能夠提升粉絲們的接收意願與互動率，同時也是提高粉絲黏著度的重要關鍵，本課程將透過四大面向：社群品牌、圖像、文案與數據解讀，依序邀請到社群經營高手們，前來與大家分享他們的觀察以及實戰經驗，讓學員們都能創造出自己的社群經濟！',
        min_number: 15,
        max_number: 30,
        price: 3000,
        state: 'judge_ac',
        start_datetime: (+ new Date(2017, 5, 27)),
        end_datetime:   (+ new Date(2017, 5, 28)),
        deadline:       (+ new Date(2017, 5, 26)),
        pre_deadline:   (+ new Date(2017, 5, 26)),
        created_at:     (+ new Date(2017, 5, 16)),
        updated_at:     (+ new Date(2017, 5, 17))
    },
    {
        image_url: 'https://az796311.vo.msecnd.net/userupload/b45c8107ecca447fb595efac541a7236.jpg',
        title: '易禧迷你設計學',
        location: ' 台北市中正區',
        introduction: '編出我的音樂，為夢想找出口！\n6小時藉由「音樂軟體Cubase」，達到操作軟體及玩音樂的樂趣！',
        content: '「聲音」就和「視覺影像」一樣重要！\n\n音樂已經不是配角，是主流的感官享受。\n\n這堂課從「基礎原創」出發，完全沒有音樂底子也可以來學！\n\n結合「音樂軟體Cubase」，有時玩電音，有時玩流行音樂，\n\n只要用一台PC跟主控鍵盤 ，就能玩出音樂的樂趣！\n\n深入淺出的教學，更清楚看見音樂編曲世界的輪廓。',
        min_number: 5,
        max_number: 20,
        price: 1800,
        state: 'judge_ac',
        start_datetime: (+ new Date(2017, 6, 4)),
        end_datetime:   (+ new Date(2017, 6, 11)),
        deadline:       (+ new Date(2017, 6, 3)),
        pre_deadline:   (+ new Date(2017, 6, 3)),
        created_at:     (+ new Date(2017, 5, 20)),
        updated_at:     (+ new Date(2017, 5, 20))
    },
    {
        image_url: 'https://az796311.vo.msecnd.net/userupload/c09ba67821f64ceb8ff25458946808ad.jpg',
        title: '大人學品味：專業男士的西裝知識',
        location: '大人學台北教室',
        introduction: '男人衣櫃裡不能沒有一套合身的好西裝！\n40年經驗的訂製達人親臨分享，並提供現場個人諮詢！',
        content: '大部分男生到了一定年紀後，內涵通常不差、有各自的專業、也都是善良溫和的好男人，可惜往往在最後一哩的包裝上，吃了很大的虧。 人終究是視覺動物，所以對他人的吸引力，其實有一大比例來自於你的外在形象。 雖然這聽起來不太理性，但同樣一個人穿著汗衫跟藍白拖，可信度就是沒有整套西裝皮鞋來的好。 我們身邊高達八成的女生也都承認：「他們其實是西裝控」， 只要男人穿上得體的西裝，看起來就是顯得更值得仰望。',
        min_number: 10,
        max_number: 50,
        price: 2700,
        state: 'judge_ac',
        start_datetime: (+ new Date(2017, 7, 27, 14)),
        end_datetime:   (+ new Date(2017, 7, 27, 17)),
        deadline:       (+ new Date(2017, 7, 25)),
        pre_deadline:   (+ new Date(2017, 7, 25)),
        created_at:     (+ new Date(2017, 5, 2)),
        updated_at:     (+ new Date(2017, 5, 5))
    },
    {
        image_url: 'https://az796311.vo.msecnd.net/userupload/9656a0dc009f44168183dbc891551d27.jpg',
        title: '戀愛大人學：搞懂戀愛規則，學習關係雙贏',
        location: '大人學台北教室',
        introduction: '大人的感情，起點在於搞清楚整個「局」- 判讀對方的需求，找出合宜的雙贏策略，才能讓一段感情走得遠又走得久。',
        content: '大人的戀愛，其實起點在於搞清楚這整個「局」- 判讀對方的需求，找出合宜的雙贏策略，才能讓一段感情走得遠又走得久。 在這堂課中，Joe將透過幾個不同的感情案例，帶著大家透過看懂戀愛賽局來找到其中『阻力最小的路」，並學習如何應對以謀求雙方都能從中得到快樂的策略。 這是讓戀愛能長期維持的重要知識，也是每個大人該學習的一堂課。',
        min_number: 15,
        max_number: 45,
        price: 1200,
        state: 'judge_ac',
        start_datetime: (+ new Date(2017, 6, 22)),
        end_datetime:   (+ new Date(2017, 6, 22)),
        deadline:       (+ new Date(2017, 5, 25)),
        pre_deadline:   (+ new Date(2017, 5, 25)),
        created_at:     (+ new Date(2017, 5, 16)),
        updated_at:     (+ new Date(2017, 5, 17))
    },
];

module.exports = {
    columnSet,
    datas,
};
