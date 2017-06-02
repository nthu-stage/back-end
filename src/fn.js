function prop_ts_2_datestring(o, prop) {
    // console.log("prop_ts_2_datestring");
    // console.log(JSON.stringify(o));
    if (o[prop]) {
        // o[prop] = new Date((+ o[prop])*1000).toString();
        o[prop] = (+ o[prop])*1000;
    } else {
        console.log(`property "${prop}" doesn't exists. (prop_ts_2_datestring)`)
    }
}

module.exports = {
    prop_ts_2_datestring
};
