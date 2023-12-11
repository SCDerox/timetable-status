const fs = require('fs');
const structure = JSON.parse(fs.readFileSync('./structure.json').toString());
const timetable = JSON.parse(fs.readFileSync('./timetable.json').toString());

const currentTime = new Date();
const today = timetable[currentTime.getDay()];
if (!today) {
    console.log('');
    process.exit();
}

let currentStructureID = null;
let currentLessonNumber = 0;
for (const structureID in structure) {
    const structureData = structure[structureID];
    if (structureData.type === 'LESSON') currentLessonNumber++;
    const endDate = calculateConfigValue(structureData.end)
    const startDate = calculateConfigValue(structureData.start)
    if (startDate.getTime() <= currentTime.getTime() && currentTime.getTime() < endDate.getTime()) {
        currentStructureID = structureID;
        break;
    }
}

if (!currentLessonNumber) {
    console.log('');
    process.exit();
}

let structureData = structure[currentStructureID];
if (!structureData) {
    const lessons = Object.keys(today);
    if (lessons.length === 0) process.exit();
    const nextLesson = structure.filter(f => f.type ==='LESSON')[lessons[0]-1];
    const lessonData = today[lessons[0]]
    const nextLessonMeta = timetable['_meta'][lessonData.lesson]
    console.log(`Unterrichtsbeginn in ${displayTimeLeft((calculateConfigValue(nextLesson.start).getTime() - currentTime.getTime()) / 1000)}: ${nextLessonMeta.shortName || lessonData.lesson} (${lessonData.room || nextLessonMeta.room})`)
    process.exit();
}
const endDate = calculateConfigValue(structureData.end)
let timeTillNextStructure = (endDate.getTime() - currentTime.getTime()) / 1000;

if (structureData.type === 'BREAK') {
    let string = '';
    if (timeTillNextStructure / 60 <= 5) {
        string = 'Fuge';
    }else string = 'Pause'
    string = string + ' noch ' + displayTimeLeft(timeTillNextStructure);
    const nextLesson = today[currentLessonNumber+1];
    if (nextLesson) {
        const nextLessonMeta = timetable['_meta'][nextLesson.lesson];
        string = string + ', dann ' + nextLesson.lesson + ` (${nextLesson.room || nextLessonMeta.room})`;
        console.log(string);
        process.exit();
    } else currentLessonNumber++;
}

const lessonData = today[currentLessonNumber];
if (!lessonData) {
    const lessons = Object.keys(today).map(e => parseInt(e)).filter(f => f > currentLessonNumber);
    if (lessons.length === 0) process.exit();
    const nextLesson = structure.filter(f => f.type ==='LESSON')[lessons[0]-1];
    const lessonData = today[lessons[0]]
    const nextLessonMeta = timetable['_meta'][lessonData.lesson]
    console.log(`Freistunde noch ${displayTimeLeft((calculateConfigValue(nextLesson.start).getTime() - currentTime.getTime()) / 1000)} bis ${nextLessonMeta.shortName || lessonData.lesson} (${lessonData.room || nextLessonMeta.room})`);
    process.exit();
}

const metaData = timetable['_meta'][lessonData.lesson];

let afterString = ''; // aka suffix
if (timeTillNextStructure <= 60*10) {
    afterString = ', dann ';
    if (currentLessonNumber === 3) afterString = afterString + 'Pause';
    else {
        const nextLesson = today[currentLessonNumber+1];
        if (!nextLesson) {
            const hasMoreLessons = Object.keys(today).map(e => parseInt(e)).filter(f => f > currentLessonNumber).length !== 0;
            afterString = afterString + (hasMoreLessons ? 'Freistunde' : 'Unterrichtsende');
        } else {
            const nextLessonMeta = timetable['_meta'][nextLesson.lesson];
            afterString = afterString + nextLesson.lesson + ' (' + (nextLesson.room || nextLessonMeta.room) + ')'
        }
    }
}

console.log(lessonData.lesson + (timeTillNextStructure > (60*40) ? ' (' + metaData.room + ')' : '') +  ' noch ' + displayTimeLeft(timeTillNextStructure) + afterString);

function calculateConfigValue(value) {
   return new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate(), parseInt(value.split(':')[0]), parseInt(value.split(':')[1]));
}

function displayTimeLeft(t) {
    if (t >= 60*60) {
        const k = (t%(60*60)) / 60;
        if (k === 0) return `${Math.floor(t/(60*60))}h`;
        return `${Math.floor(t/(60*60))}h ${k.toFixed(0)}min`
    }
    if (t < (5*60)) {
        const k = (t%60)
        return `${Math.floor(t/60)}:${k < 10 ? '0': ''}${Math.round(k)}min`
    }
    return (Math.ceil(t / 60)).toFixed(0) + 'min'
}