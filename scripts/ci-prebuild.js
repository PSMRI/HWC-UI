#!/usr/bin/env node

/*
* AMRIT – Accessible Medical Records via Integrated Technology
* Integrated EHR (Electronic Health Records) Solution
*
* Copyright (C) "Piramal Swasthya Management and Research Institute"
*
* This file is part of AMRIT.
*
* This program is free software: you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License
* along with this program.  If not, see https://www.gnu.org/licenses/.
*/

const fs = require('fs');
const path = require('path');

const ejs = require('ejs');

const environmentFilesDirectory = path.join(__dirname, '../src/environments');
const targetEnvironmentTemplateFileName = 'environment.ci.ts.template';
const targetEnvironmentFileName = 'environment.ci.ts';

// Load template file
const environmentTemplate = fs.readFileSync(
  path.join(environmentFilesDirectory, targetEnvironmentTemplateFileName),
  {encoding: 'utf-8'}
);

const defaultEnvValues = {
  COMMON_API_BASE: '',
  COMMON_API_OPEN_SYNC: '',
  IDENTITY_API_BASE: '',
  TM_API_BASE: '',
  HELPLINE104_API_BASE: '',
  MMU_API_BASE: '',
  SCHEDULER_API_BASE: '',
  ADMIN_API_BASE: '',
  FHIR_API_BASE: '',
  SERVER_IP: '',
  SWYMED_IP: '',
  HWC_SCHEDULER_UI: '',
  HWC_INVENTORY_UI: '',
  HWC_API_BASE : '',
  HWC_UI_BASE: '',
  ABHA_MODE: '',
  SESSION_STORAGE_ENC_KEY: '',
  SITE_KEY: '',
  CAPTCHA_CHALLENGE_URL: '',
  ENABLE_CAPTCHA: false,
  SITE_ID: '1',
  TRACKER_URL: '//matomo.piramalswasthya.org/',
  TRACKING_PLATFORM: 'matomo',
  TRACKING_ENABLED: 'true',
};

// Generate output data
const output = ejs.render(environmentTemplate, Object.assign({}, defaultEnvValues, process.env));
// Write environment file
fs.writeFileSync(path.join(environmentFilesDirectory, targetEnvironmentFileName), output);

process.exit(0);
