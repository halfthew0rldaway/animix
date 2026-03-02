const getNum = (ep: any) => {
    const match = (ep.name || "").match(/\d+(\.\d+)?/) || (ep.slug || "").match(/episode?-?\s*(\d+(\.\d+)?)/i);
    return match ? parseFloat(match[1] || match[0]) : 0;
};
console.log(getNum({slug: "shuumatsu-no-walkure-episode-1-subtitle-indonesia"}));
console.log(getNum({slug: "shuumatsu-no-walkure-episode-15-subtitle-indonesia"}));
console.log("decode URL comp");
const url1 = encodeURIComponent(decodeURIComponent("shuumatsu-no-walkure-episode-1-subtitle-indonesia").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/walka¼re/gi, "walkure"));
console.log(url1);
