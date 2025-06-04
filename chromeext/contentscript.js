const regex = /citation needed/gi;
const URL = 'http://localhost:4567/get-topranked-citation';

(async function queryList() {
    const paragraphs = document.getElementsByTagName('p');
    for (let i = 0; i < paragraphs.length; i++) {
        const para = paragraphs[i];
        if (regex.test(para.innerText)) {
            const citation = await getCitation();
            if (citation) {
                addReference(citation);
                const referenceNum = document.querySelectorAll('.references li').length;
                para.innerHTML = para.innerHTML.replace(regex, referenceNum.toString());
                chrome.runtime.sendMessage({}, () => {});
            }
        }
    }
})();

async function getCitation() {
    try {
        const response = await fetch(URL);
        const citation = await response.json();
        return citation;
    } catch (e) {
        console.error('Citation request failed', e);
        return null;
    }
}

function addReference(referenceText) {
    const list = document.getElementsByClassName('references')[0];
    const li = document.createElement('li');
    li.appendChild(document.createTextNode(referenceText));
    list.appendChild(li);
}
