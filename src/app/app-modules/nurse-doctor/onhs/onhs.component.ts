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
import { Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { OnhsPatientDetails, OnhsService } from './onhs.service';
import { environment } from 'src/environments/environment';

/** What the screen is doing right now, in user terms. */
type Phase = 'idle' | 'busy' | 'done' | 'pending' | 'error';

/** A service on offer, flattened out of the network catalogue. */
interface HealthService {
  offerId: string;
  resourceId: string;
  considerationId: string;
  name: string;
  providerName: string;
  serviceType: string;
  packaging: string;
  price: number | null;
  currency: string;
  /** Provider that published this offer — where select/init/confirm are sent. */
  bppId: string;
  bppUri: string;
  /** BULK_PROCUREMENT offers are funded by entitlement, not a fresh payment. */
  bulk: boolean;
}

/** One stage of the booking, as the network records it. */
interface ProgressStage {
  key: string;
  label: string;
  done: boolean;
  at: string;
}

/** A single reply the provider sent back, for the activity list. */
interface ActivityEntry {
  label: string;
  at: string;
}

@Component({
  selector: 'app-onhs',
  templateUrl: './onhs.component.html',
  styleUrls: ['./onhs.component.css'],
})
export class OnhsComponent implements OnInit {
  activeStep = 0;

  /** Step 1 — find a service. */
  searchText = 'TeleConsultation';
  searchPhase: Phase = 'idle';
  searchMessage = '';
  services: HealthService[] = [];
  selected: HealthService | null = null;

  /** Step 2 — patient and consent. */
  patient: OnhsPatientDetails = {
    patientId: 'PATIENT-001',
    patientName: '',
    abhaId: '',
    dateOfBirth: '',
    gender: '',
    primaryLanguage: 'hi',
    flwId: 'FLW-001',
    flwName: '',
    chwId: '',
    clientNotes: '',
  };
  consentGiven = false;
  detailsPhase: Phase = 'idle';
  detailsMessage = '';

  /** Step 3 — payment. */
  paymentMethod = 'UPI';
  paymentPhase: Phase = 'idle';
  paymentMessage = '';

  /** Step 4 — outcome. */
  resultPhase: Phase = 'idle';
  resultMessage = '';
  performance: any = null;
  bookingConfirmed = false;

  /** Booking progress, from the network's own record of provider replies. */
  progress: ProgressStage[] = [];
  activity: ActivityEntry[] = [];
  progressLoading = false;

  /** Every provider reply this booking is waiting on, in order. */
  private readonly stageLabels: { key: string; label: string }[] = [
    { key: 'on_discover', label: 'Service found' },
    { key: 'on_select', label: 'Quote received' },
    { key: 'on_init', label: 'Details acknowledged' },
    { key: 'on_confirm', label: 'Booking confirmed' },
    { key: 'on_status', label: 'Result published' },
  ];

  /** Reference to pre-purchased capacity, when paying by entitlement. */
  entitlementRef = '';

  readonly paymentOptions = [
    { value: 'UPI', label: 'UPI' },
    { value: 'CASH_VIA_FLW', label: 'Cash to field worker' },
    { value: 'BANK_TRANSFER', label: 'Bank transfer' },
    { value: 'ENTITLEMENT', label: 'Pre-purchased capacity (entitlement)' },
  ];

  readonly genders = ['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'];

  constructor(private onhsService: OnhsService) {}

  ngOnInit(): void {
    this.startOver();
  }

  /** Short, human-readable handle for this booking. */
  get reference(): string {
    return this.onhsService.transactionId.split('-')[0].toUpperCase();
  }

  get amount(): number | null {
    return this.selected?.price ?? null;
  }

  /** True when funding comes from a pre-purchased entitlement, not a payment. */
  get payingByEntitlement(): boolean {
    return this.paymentMethod === 'ENTITLEMENT';
  }

  /** Entitlement funding needs its reference before the booking can proceed. */
  get canPay(): boolean {
    if (this.paymentPhase === 'busy') {
      return false;
    }
    return this.payingByEntitlement ? !!this.entitlementRef.trim() : true;
  }

  /** True while payments are simulated locally rather than sent to a gateway. */
  get testPaymentMode(): boolean {
    return this.onhsService.testPaymentMode;
  }

  get paymentRef(): string {
    return this.onhsService.lastPaymentRef;
  }

  get authCode(): string {
    return this.onhsService.lastAuthCode;
  }

  get currency(): string {
    return this.selected?.currency || 'INR';
  }

  startOver(): void {
    this.onhsService.newTransaction();
    this.activeStep = 0;
    this.searchPhase = 'idle';
    this.searchMessage = '';
    this.services = [];
    this.selected = null;
    this.consentGiven = false;
    this.detailsPhase = 'idle';
    this.detailsMessage = '';
    this.paymentMethod = 'UPI';
    this.entitlementRef = '';
    this.paymentPhase = 'idle';
    this.paymentMessage = '';
    this.resultPhase = 'idle';
    this.resultMessage = '';
    this.performance = null;
    this.bookingConfirmed = false;
    this.progress = [];
    this.activity = [];
    this.patient = {
      patientId: 'PATIENT-001',
      patientName: '',
      abhaId: '',
      dateOfBirth: '',
      gender: '',
      primaryLanguage: 'hi',
      flwId: 'FLW-001',
      flwName: '',
      chwId: '',
      clientNotes: '',
    };
  }

  // ---------------------------------------------------------------- step 1

  searchServices(): void {
    if (!this.searchText.trim()) {
      return;
    }
    this.searchPhase = 'busy';
    this.searchMessage = 'Searching the network for available services…';
    this.services = [];
    this.selected = null;

    this.onhsService.discover(this.searchText).subscribe({
      next: (ack: any) => {
        if (!OnhsComponent.acked(ack)) {
          this.searchPhase = 'error';
          this.searchMessage = 'The network did not accept the search.';
          return;
        }
        this.onhsService.waitForCallback('on_discover').subscribe({
          next: (callback: any) => {
            this.services = this.toServices(
              callback?.body?.message?.catalogs || [],
            );
            this.searchPhase = 'done';
            this.searchMessage = this.services.length
              ? ''
              : 'No services matched that search.';
          },
          error: (err: HttpErrorResponse) => {
            this.searchPhase = OnhsComponent.phaseFor(err);
            this.searchMessage =
              this.searchPhase === 'pending'
                ? 'No provider replied in time. Try searching again.'
                : OnhsComponent.readError(err);
          },
        });
      },
      error: (err: HttpErrorResponse) => {
        this.searchPhase = 'error';
        this.searchMessage = OnhsComponent.readError(err);
      },
    });
  }

  /** Picking a service asks the provider to price it, then opens patient details. */
  chooseService(service: HealthService): void {
    this.selected = service;
    this.onhsService.considerationId =
      service.considerationId || environment.onhsConsiderationId;
    this.onhsService.amount = service.price ?? this.onhsService.amount;
    this.onhsService.currency = service.currency || this.onhsService.currency;
    this.onhsService.setProvider(service.bppId, service.bppUri);
    // Bulk packs are drawn from capacity rather than paid for per patient.
    this.paymentMethod = service.bulk ? 'ENTITLEMENT' : 'UPI';
    this.detailsPhase = 'busy';
    this.detailsMessage = 'Getting a quote from the provider…';
    this.activeStep = 1;

    this.onhsService
      .select({
        resourceId: service.resourceId,
        offerId: service.offerId,
      })
      .subscribe({
        next: (ack: any) => {
          if (!OnhsComponent.acked(ack)) {
            this.detailsPhase = 'error';
            this.detailsMessage = OnhsComponent.nackReason(
              ack,
              'The provider did not accept the request.',
            );
            return;
          }
          this.onhsService.waitForCallback('on_select').subscribe({
            next: (callback: any) => {
              const rejected = OnhsComponent.callbackError(callback);
              if (rejected) {
                this.detailsPhase = 'error';
                this.detailsMessage = rejected;
                return;
              }
              const contract = callback?.body?.message?.contract;
              if (contract?.id) {
                this.onhsService.contractId = contract.id;
              }
              const quoted = contract?.consideration?.[0];
              if (quoted?.id) {
                this.onhsService.considerationId = quoted.id;
              }
              const attrs = quoted?.considerationAttributes;
              if (this.selected && typeof attrs?.netAmount === 'number') {
                this.selected.price = attrs.netAmount;
                this.selected.currency = attrs.currency || this.currency;
                this.onhsService.amount = attrs.netAmount;
                this.onhsService.currency = this.selected.currency;
              }
              this.detailsPhase = 'done';
              this.detailsMessage = '';
            },
            error: (err: HttpErrorResponse) => {
              this.detailsPhase = OnhsComponent.phaseFor(err);
              this.detailsMessage =
                this.detailsPhase === 'pending'
                  ? 'The provider has not sent a quote yet. You can still enter details — the listed price applies.'
                  : OnhsComponent.readError(err);
            },
          });
        },
        error: (err: HttpErrorResponse) => {
          this.detailsPhase = 'error';
          this.detailsMessage = OnhsComponent.readError(err);
        },
      });
  }

  // ---------------------------------------------------------------- step 2

  /*
   * Date of birth is optional, but if given it must be a schema `date`
   * (YYYY-MM-DD). The field is free text, so a plausible typo like 9/9/1990
   * would otherwise reach the network and fail init with an opaque
   * "string doesn't match the format date".
   */
  get dobInvalid(): boolean {
    const dob = (this.patient.dateOfBirth || '').trim();
    return !!dob && !/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(dob);
  }

  get detailsComplete(): boolean {
    return (
      !!this.patient.patientName.trim() &&
      !!this.patient.gender &&
      !!this.patient.flwName.trim() &&
      !this.dobInvalid &&
      this.consentGiven
    );
  }

  /** Sends patient identity and consent, then moves to payment. */
  submitDetails(): void {
    if (!this.detailsComplete || !this.selected) {
      return;
    }
    this.detailsPhase = 'busy';
    this.detailsMessage = 'Sending patient details and consent…';

    const selection = {
      resourceId: this.selected.resourceId,
      offerId: this.selected.offerId,
    };

    this.onhsService.init(selection, this.patient).subscribe({
      next: (ack: any) => {
        if (!OnhsComponent.acked(ack)) {
          this.detailsPhase = 'error';
          this.detailsMessage = 'The provider did not accept the details.';
          return;
        }
        this.onhsService.waitForCallback('on_init').subscribe({
          next: (callback: any) => {
            const rejected = OnhsComponent.callbackError(callback);
            if (rejected) {
              this.detailsPhase = 'error';
              this.detailsMessage = rejected;
              return;
            }
            this.detailsPhase = 'done';
            this.detailsMessage = '';
            this.activeStep = 2;
          },
          error: (err: HttpErrorResponse) => {
            this.detailsPhase = OnhsComponent.phaseFor(err);
            if (this.detailsPhase === 'pending') {
              this.detailsMessage =
                'Details sent. The provider has not acknowledged them yet.';
              this.activeStep = 2;
            } else {
              this.detailsMessage = OnhsComponent.readError(err);
            }
          },
        });
      },
      error: (err: HttpErrorResponse) => {
        this.detailsPhase = 'error';
        this.detailsMessage = OnhsComponent.readError(err);
      },
    });
  }

  // ---------------------------------------------------------------- step 3

  payAndConfirm(): void {
    if (!this.selected) {
      return;
    }
    // Exactly one funding path may travel with the consideration.
    if (this.payingByEntitlement) {
      this.onhsService.entitlementRef = this.entitlementRef.trim();
      this.onhsService.paymentMethod = 'OTHER';
    } else {
      this.onhsService.entitlementRef = '';
      this.onhsService.paymentMethod = this.paymentMethod;
    }
    this.paymentPhase = 'busy';
    this.paymentMessage = 'Confirming the booking with the provider…';

    const selection = {
      resourceId: this.selected.resourceId,
      offerId: this.selected.offerId,
    };

    this.onhsService.confirm(selection, this.patient).subscribe({
      next: (ack: any) => {
        if (!OnhsComponent.acked(ack)) {
          this.paymentPhase = 'error';
          this.paymentMessage = 'The provider did not accept the payment.';
          return;
        }
        this.onhsService.waitForCallback('on_confirm').subscribe({
          next: (callback: any) => {
            const rejected = OnhsComponent.callbackError(callback);
            if (rejected) {
              this.paymentPhase = 'error';
              this.paymentMessage = rejected;
              return;
            }
            const contract = callback?.body?.message?.contract;
            if (contract?.id) {
              this.onhsService.contractId = contract.id;
            }
            this.performance = contract?.performance?.[0] || null;
            this.bookingConfirmed = true;
            this.paymentPhase = 'done';
            this.paymentMessage = '';
            this.activeStep = 3;
            this.loadProgress();
          },
          error: (err: HttpErrorResponse) => {
            this.paymentPhase = OnhsComponent.phaseFor(err);
            if (this.paymentPhase === 'pending') {
              this.paymentMessage =
                'Payment sent. The provider has not confirmed the booking yet.';
              this.activeStep = 3;
              this.loadProgress();
            } else {
              this.paymentMessage = OnhsComponent.readError(err);
            }
          },
        });
      },
      error: (err: HttpErrorResponse) => {
        this.paymentPhase = 'error';
        this.paymentMessage = OnhsComponent.readError(err);
      },
    });
  }

  // ---------------------------------------------------------------- step 4

  get canCheckResult(): boolean {
    return !!this.onhsService.contractId;
  }

  checkResult(): void {
    if (!this.selected || !this.canCheckResult) {
      return;
    }
    this.resultPhase = 'busy';
    this.resultMessage = 'Checking with the provider…';

    const selection = {
      resourceId: this.selected.resourceId,
      offerId: this.selected.offerId,
    };

    this.onhsService.status(selection).subscribe({
      next: (ack: any) => {
        if (!OnhsComponent.acked(ack)) {
          this.resultPhase = 'error';
          this.resultMessage = 'The provider did not accept the request.';
          return;
        }
        this.onhsService.waitForCallback('on_status').subscribe({
          next: (callback: any) => {
            const rejected = OnhsComponent.callbackError(callback);
            if (rejected) {
              this.resultPhase = 'error';
              this.resultMessage = rejected;
              return;
            }
            const contract = callback?.body?.message?.contract;
            this.performance = contract?.performance?.[0] || this.performance;
            this.resultPhase = 'done';
            this.resultMessage = '';
            this.loadProgress();
          },
          error: (err: HttpErrorResponse) => {
            this.resultPhase = OnhsComponent.phaseFor(err);
            this.resultMessage =
              this.resultPhase === 'pending'
                ? 'No result yet. The service may still be in progress — check again shortly.'
                : OnhsComponent.readError(err);
          },
        });
      },
      error: (err: HttpErrorResponse) => {
        this.resultPhase = 'error';
        this.resultMessage = OnhsComponent.readError(err);
      },
    });
  }

  /**
   * Reads the network's own record of this booking: which provider replies have
   * landed (flow) and when each arrived (callbacks). Backs the progress tracker
   * and the activity list on the result screen.
   */
  loadProgress(): void {
    this.progressLoading = true;

    this.onhsService.getFlow().subscribe({
      next: (flow: any) => {
        const steps = flow?.steps || {};
        this.progress = this.stageLabels.map((stage) => ({
          key: stage.key,
          label: stage.label,
          done: !!steps[stage.key]?.received,
          at: OnhsComponent.clockTime(steps[stage.key]?.receivedAt),
        }));
        this.progressLoading = false;
      },
      error: () => {
        this.progress = [];
        this.progressLoading = false;
      },
    });

    this.onhsService.getAllCallbacks().subscribe({
      next: (res: any) => {
        const list: any[] = Array.isArray(res)
          ? res
          : res?.callbacks || res?.data || [];
        this.activity = list
          .map((entry: any) => ({
            label: this.labelFor(entry?.action),
            at: OnhsComponent.clockTime(entry?.receivedAt),
          }))
          .filter((entry: ActivityEntry) => !!entry.label);
      },
      error: () => (this.activity = []),
    });
  }

  private labelFor(action: string): string {
    return this.stageLabels.find((s) => s.key === action)?.label || '';
  }

  /** 2026-09-09T05:46:35.985Z -> 05:46 */
  static clockTime(value: string | undefined): string {
    if (!value) {
      return '';
    }
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return '';
    }
    const hh = `${date.getHours()}`.padStart(2, '0');
    const mm = `${date.getMinutes()}`.padStart(2, '0');
    return `${hh}:${mm}`;
  }

  /** Clinical outcome fields, when the provider has published them. */
  get clinical(): any {
    return this.performance?.performanceAttributes || null;
  }

  get reportLabels(): string[] {
    return this.clinical?.artifactsGenerated || [];
  }

  get findings(): string[] {
    return this.clinical?.clinicalInterpretation?.flaggedFindings || [];
  }

  /** Model confidence, or null when the provider published none. */
  get confidence(): number | null {
    const value = this.clinical?.clinicalInterpretation?.confidence;
    return typeof value === 'number' ? value : null;
  }

  // ---------------------------------------------------------------- helpers

  private toServices(catalogs: any[]): HealthService[] {
    const rows: HealthService[] = [];
    catalogs.forEach((catalog: any) => {
      const resources: any[] = catalog?.resources || [];
      const providerName = catalog?.provider?.descriptor?.name || 'Provider';
      /*
       * Provider routing is taken as a pair, never mixed. The envelope's bppId
       * is the network fabric rather than the provider, so it is not a usable
       * fallback; a catalog that omits its own routing falls back to the
       * configured provider instead.
       */
      const routed = !!catalog?.bppId;
      const bppId = routed ? catalog.bppId : environment.onhsBppId;
      const bppUri = routed
        ? OnhsComponent.receiverUri(catalog?.bppUri)
        : environment.onhsBppUri;

      (catalog?.offers || []).forEach((offer: any) => {
        const resourceId = (offer?.resourceIds || [])[0] || '';
        const resource = resources.find((r: any) => r?.id === resourceId);
        const substituted = OnhsComponent.substitutes(resourceId);
        const consideration = (offer?.considerations || [])[0];
        const consAttrs = consideration?.considerationAttributes || {};
        const offerAttrs = offer?.offerAttributes || {};
        rows.push({
          offerId: OnhsComponent.effectiveOfferId(resourceId, offer?.id || ''),
          resourceId,
          considerationId: consideration?.id || '',
          name:
            resource?.descriptor?.name ||
            offer?.descriptor?.name ||
            'Health service',
          providerName,
          serviceType: OnhsComponent.humanise(
            resource?.resourceAttributes?.healthServiceType,
          ),
          packaging: OnhsComponent.humanise(offerAttrs?.offerType),
          price: consAttrs?.pricePerUnit ?? null,
          currency: consAttrs?.currency || 'INR',
          bppId,
          bppUri,
          /*
           * Read the offer type off the offer actually being sent. The catalog
           * lists the configured resource as BULK_PROCUREMENT, but the offer
           * substituted above is a single engagement quoted to SELF — treating
           * it as bulk would wrongly demand an entitlementRef to fund it.
           */
          bulk: !substituted && offerAttrs?.offerType === 'BULK_PROCUREMENT',
        });
      });
    });
    return rows;
  }

  /*
   * The catalog lists the configured resource under a BULK_PROCUREMENT offer id
   * that the PN rejects; the PN wants the single-engagement offer instead, and
   * that id is published by no catalog. Send the id the PN will actually
   * honour, so the working path is reachable from the listing.
   *
   * This reflects stale sandbox data, not a rule of the network. Clearing
   * either setting turns the substitution off and sends the catalog's own ids,
   * which is what should happen once the PN's catalog is corrected.
   */
  static substitutes(resourceId: string): boolean {
    return (
      !!environment.onhsResourceId &&
      !!environment.onhsOfferId &&
      resourceId === environment.onhsResourceId
    );
  }

  static effectiveOfferId(resourceId: string, offerId: string): string {
    return OnhsComponent.substitutes(resourceId)
      ? environment.onhsOfferId
      : offerId;
  }

  /**
   * Catalogs advertise their bppUri as a bare origin, but Beckn calls have to
   * reach the provider's receiver. Append the receiver path when the catalog
   * gives no path of its own, and leave an explicit one untouched.
   */
  static receiverUri(uri: string | undefined): string {
    if (!uri) {
      return environment.onhsBppUri;
    }
    const trimmed = uri.replace(/\/+$/, '');
    try {
      const parsed = new URL(trimmed);
      return parsed.pathname && parsed.pathname !== '/'
        ? trimmed
        : `${trimmed}/bpp/receiver`;
    } catch {
      return trimmed;
    }
  }

  /** DIAGNOSTIC_ANALYTICS -> Diagnostic analytics */
  static humanise(value: string | undefined): string {
    if (!value) {
      return '';
    }
    const spaced = value.replace(/_/g, ' ').toLowerCase();
    return spaced.charAt(0).toUpperCase() + spaced.slice(1);
  }

  /** discover ACKs as message.status; the rest as message.ack.status. */
  /**
   * A callback can arrive as HTTP 200 and still carry a provider rejection in
   * its body — on_select does this when the funding path is wrong. Treat that
   * as a failure rather than reading a contract that is not there.
   */
  static callbackError(callback: any): string {
    const err = callback?.body?.error;
    if (!err) {
      return '';
    }
    return err.message || err.code || 'The provider rejected the request.';
  }

  /** Pulls the reason out of a NACK that still came back as HTTP 200. */
  static nackReason(body: any, fallback: string): string {
    return body?.error?.message || body?.error?.code || fallback;
  }

  static acked(body: any): boolean {
    return (body?.message?.status || body?.message?.ack?.status) === 'ACK';
  }

  /**
   * A long-poll timeout comes back as 404 with an `error` field. That is not a
   * failure of the request — it means the provider has not replied yet.
   */
  static phaseFor(err: HttpErrorResponse): Phase {
    return err.status === 404 && err.error?.error ? 'pending' : 'error';
  }

  static readError(err: HttpErrorResponse): string {
    if (err.status === 0) {
      // A browser reports a CORS block and a genuine network failure the same
      // way: status 0 with no body. Log the likely cause for whoever is
      // debugging, and keep the on-screen wording plain.
      console.error(
        `[ONHS] Request to ${environment.onhsSeekerBase} failed with status 0. ` +
          'This is usually CORS: the seeker must return an ' +
          'Access-Control-Allow-Origin header for this site, or /bap and ' +
          '/seeker must be reverse-proxied from this origin.',
        err,
      );
      return 'Could not reach the health network. Please try again.';
    }

    /*
     * A provider rejection arrives as HTTP 400 with
     * {message:{ack:{status:'NACK'}}, error:{code, message}} — the useful text
     * is nested. A long-poll timeout uses a plain string `error` instead, and
     * an unreachable provider tunnel returns an HTML error page.
     */
    const body = err.error;
    const nested = body?.error;
    if (nested && typeof nested === 'object' && nested.message) {
      return nested.message;
    }
    if (typeof nested === 'string' && nested) {
      return nested;
    }
    if (typeof body?.message === 'string' && body.message) {
      return body.message;
    }
    if (err.status === 404) {
      return 'The provider is not reachable right now.';
    }
    return `The network returned an error (${err.status}).`;
  }

  trackByOffer(_index: number, row: HealthService): string {
    return `${row.resourceId}|${row.offerId}`;
  }
}
