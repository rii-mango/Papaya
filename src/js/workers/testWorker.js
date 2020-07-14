// "use strict";

// var papaya = papaya || {};
// papaya.workers = papaya.workers || {};
// papaya.workers.testWorker = papaya.workers.testWorker || {};

self.addEventListener('message', function (event) {
    console.log('Worker received:', event.data);
});