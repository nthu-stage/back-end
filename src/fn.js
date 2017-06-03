function tsWrapper(object, prop) {
    if (object[prop]) {
        // object[prop] = new Date((+ object[prop])*1000).toString();
        // object[prop] = (+ object[prop])*1000;
        object[prop] = (+ object[prop]);
    } else {
        console.log(`property "${prop}" doesn't exists. (tsWrapper)`)
    }
}

module.exports = {
    tsWrapper
};
