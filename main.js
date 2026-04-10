"use strict";
import {search} from "./search.js";

const config = {
    maxSteps: 10,
    progLength: 7,
    programsCount: Infinity,

    logHoldout: false,
    logNonhalted: false,
    logHalted: false,
    logRecord: true,
};

search(config);