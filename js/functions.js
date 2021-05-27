"use strict";

/**
 * 指定したクラス・IDのエレメントを返す
 * @param {String} id 
 * @returns Element
 */
function $(id) {
    return document.querySelector(id);
}

/**
 * 入力された文字列をパースする
 * @param {String} text
 * @returns Object 
 */
function parse(text) {
    const TIME_LENGTH = 4;
    let time, category, detail, categoryStrLen, timeStamp = [], jso = {};

    // 作業ログをJSONに変換
    text.split("\n").forEach(line => {
        time = line.substr(0,TIME_LENGTH);  // 自国の取得
        categoryStrLen = line.indexOf("：") -TIME_LENGTH;
        category = line.substr(TIME_LENGTH, categoryStrLen > 0 ? categoryStrLen : undefined);
        const head = line.indexOf("：") < 0 ? TIME_LENGTH : line.indexOf("：") +1; // "："の文字分だけindexを進める
        detail = line.substr(head);

        timeStamp.push({"time":time, "category":category});
        if (!jso[category]) jso[category] = {};
        jso[category].time = 0;
        if (!jso[category].detail) jso[category].detail = [];
        jso[category].detail.push(detail);
    });

    // 作業詳細の重複をなくす
    Object.keys(jso).forEach(item => {
        jso[item].detail = Array.from(new Set(jso[item].detail)).join("、");
    });

    // 作業時間を分で集計
    for (let i = 1; i < timeStamp.length; i++ ) {
        let hour = parseInt(timeStamp[i].time.substr(0,2)) - parseInt(timeStamp[i-1].time.substr(0,2));
        let min = parseInt(timeStamp[i].time.substr(2,2)) - parseInt(timeStamp[i-1].time.substr(2,2));
        if (min < 0) {
            hour -= 1;
            min += 60;
        }
        jso[timeStamp[i-1].category].time += hour * 60 + min;
    }

    // 作業時間を0.25刻みの時に換算
    Object.keys(jso).forEach(item => {
        jso[item].round = Math.floor(jso[item].time / 60) + Math.round(jso[item].time % 60 / 15) / 4;
    });

    return jso;
}

/**
 * 入力された文字列を読み込んで結果をテーブル形式で出力する
 */
function drawResult() {
    const data = parse($("#input").value);
    
    let sum = 0, total = 0;
    let html = 
`<tr>
    <th>業務名</th>
    <th>業務内容</th>
    <th>作業時間[時]</th>
    <th>作業時間[分]</th>
</tr>`;

    Object.keys(data).sort().forEach(category => {
        html += 
`<tr>
    <td style="white-space:nowrap">${category}</td>
    <td>${data[category].detail}</td>
    <td style="text-align:right">${data[category].round}</td>
    <td style="text-align:right">${data[category].time}</td>
</tr>`;
        if (category.indexOf("　") != 0) sum += data[category].time;
        total += data[category].time;
    });

    $("#result").innerHTML = html;

    $("#sum").textContent = "実働計： " + (Math.floor(sum / 60) + Math.round(sum % 60 / 15) / 4) + " h";
    $("#total").textContent = "総計： " + (Math.floor(total / 60) + Math.round(total % 60 / 15) / 4) + " h";
}

/**
 * 入力された文字列を読み込んで結果を Markdown のテーブル形式でクリップボードにコピーする
 */
 function copyResult() {
    const data = parse($("#input").value);
    
    let sum = 0, total = 0;
    let html = 
`業務名 | 業務内容 | 作業時間[時] | 作業時間[分]
--- | --- | --: | --:
`;

    Object.keys(data).sort().forEach(category => {
        html += `${category} | ${data[category].detail} | ${data[category].round} | ${data[category].time}\n`;
        if (category.indexOf("　") != 0) sum += data[category].time;
        total += data[category].time;
    });

    html += "\n実働計： " + (Math.floor(sum / 60) + Math.round(sum % 60 / 15) / 4) + " h  ";
    html += "\n総計： " + (Math.floor(total / 60) + Math.round(total % 60 / 15) / 4) + " h";

    if(navigator.clipboard){
        navigator.clipboard.writeText(html);
    }
}