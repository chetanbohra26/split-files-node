const fs = require('fs');
const util = require('util');
const crypto = require('crypto')

const FILE_NAME = "test.pdf";
const PART_COUNT = 11;

const processFile = async (fileName, partCount = 10) => {
    console.log('Checking file', fileName);
    try {
        const { size } = await util.promisify(fs.stat)(fileName);
        console.log("fileSize:", size, "to be divided in parts:", partCount);
        const hash = await getShaForFile(fileName);
        if (!hash) throw err;
        console.log('SHA hash', hash);

        const chunkSize = Math.floor(size / partCount);
        console.log("Chunksize", chunkSize);

        let start = 0;
        let count = 0;

        console.time('SPLIT_TIME_TAKEN');
        const chunkArr = [];

        while (count < partCount) {
            ++count;
            let end = start + chunkSize - 1;
            if (count === partCount) end = size;
            console.log('Working on piece #', count, "start:", start, "end:", end);
            const readStream = fs.createReadStream(
                fileName,
                { encoding: 'binary', start, end }
            );

            const chunkName = getChunkName(fileName, count);
            chunkArr.push(chunkName);
            const writeStream = fs.createWriteStream(chunkName);

            await new Promise((res, rej) =>
                readStream
                    .pipe(writeStream)
                    .on('finish', res)
                    .on('error', rej)
            );

            start += chunkSize;
        }

        console.timeEnd('SPLIT_TIME_TAKEN');

        return chunkArr;
    } catch (err) {
        console.error("Error", err);
    }
}

const getChunkName = (fileName, index) => `${fileName}.PART-${index + 1}`;

const getShaForFile = (fileName) => {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash('sha256');
        const readStream = fs.createReadStream(fileName);
        readStream.on('error', reject);
        readStream.on('data', (chunk) => hash.update(chunk));
        readStream.on('end', () => resolve(hash.digest('base64')))
    })
}

processFile(FILE_NAME, PART_COUNT).then(chunks => {
    if (!chunks) return;
    console.log('Created files:', chunks)
});