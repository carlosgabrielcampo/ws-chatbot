function arrayNmbsCreate(arr){
    let chatbotArr = Object.values(arr).filter((e) => e.number);
    return {
        chatbotArr,
        nmbArray: chatbotArr.map((e) => e.number),
        typeFilter: (filter) => chatbotArr.filter((e) => filter.includes(e.type)),
        portArray: chatbotArr.map((e) => e.host.split(":").at(-1)),
    };
}

module.exports = {arrayNmbsCreate};
