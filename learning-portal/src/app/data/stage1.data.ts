import { Stage } from '../models/step.model';
import { S1_001 } from './stage1/s1-001';
import { S1_002 } from './stage1/s1-002';
import { S1_003 } from './stage1/s1-003';
import { S1_004 } from './stage1/s1-004';
import { S1_005 } from './stage1/s1-005';
import { S1_006 } from './stage1/s1-006';
import { S1_007 } from './stage1/s1-007';
import { S1_008 } from './stage1/s1-008';
import { S1_009 } from './stage1/s1-009';
import { S1_010 } from './stage1/s1-010';
import { S1_011 } from './stage1/s1-011';
import { S1_012 } from './stage1/s1-012';
import { S1_013 } from './stage1/s1-013';
import { S1_014 } from './stage1/s1-014';

export const STAGE1: Stage = {
  id: 'stage1',
  title: 'Stage 1 — Employee REST API',
  stories: [
    S1_001,
    S1_002,
    S1_003,
    S1_004,
    S1_005,
    S1_006,
    S1_007,
    S1_008,
    S1_009,
    S1_010,
    S1_011,
    S1_012,
    S1_013,
    S1_014,
  ],
};
