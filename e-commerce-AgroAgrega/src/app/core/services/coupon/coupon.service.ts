import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  afterNextRender,
  computed,
  DestroyRef,
  inject,
  Injectable,
  makeStateKey,
  NgZone,
  PLATFORM_ID,
  signal,
  TransferState,
} from '@angular/core';
import {
  COUPON_TIME_ZONE,
  couponDateKey,
  dailyCoupons,
  findAvailableCoupon,
} from '@core/data/coupons';
import { CouponModel } from '@models/coupon';

const COUPON_DATE_STATE = makeStateKey<string>('coupon-catalog-date');
const timeFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: COUPON_TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

@Injectable({ providedIn: 'root' })
export class CouponService {
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly zone = inject(NgZone);
  private readonly transferState = inject(TransferState);
  private readonly catalogDate = signal(
    new Date(this.transferState.get(COUPON_DATE_STATE, new Date().toISOString())),
  );
  private refreshTimer?: ReturnType<typeof setTimeout>;

  readonly day = computed(() => couponDateKey(this.catalogDate()));
  readonly coupons = computed(() => dailyCoupons(this.catalogDate()));
  readonly dateLabel = computed(() =>
    new Intl.DateTimeFormat('pt-BR', {
      timeZone: COUPON_TIME_ZONE,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(this.catalogDate()),
  );

  constructor() {
    if (!this.browser) {
      this.transferState.set(COUPON_DATE_STATE, this.catalogDate().toISOString());
      return;
    }

    afterNextRender(() => {
      this.transferState.remove(COUPON_DATE_STATE);
      this.refresh();
      // Refresh suspended tabs immediately when the visitor returns.
      this.zone.runOutsideAngular(() => {
        this.document.addEventListener('visibilitychange', this.onVisibilityChange);
        this.document.defaultView?.addEventListener('focus', this.onFocus);
      });
    });

    this.destroyRef.onDestroy(() => {
      clearTimeout(this.refreshTimer);
      this.document.removeEventListener('visibilitychange', this.onVisibilityChange);
      this.document.defaultView?.removeEventListener('focus', this.onFocus);
    });
  }

  refresh(): void {
    const now = new Date();
    if (couponDateKey(now) !== this.day()) {
      this.zone.run(() => this.catalogDate.set(now));
    }
    if (this.browser) this.scheduleRefresh(now);
  }

  find(code: string): CouponModel | null {
    this.refresh();
    return findAvailableCoupon(code);
  }

  private readonly onFocus = () => this.refresh();
  private readonly onVisibilityChange = () => {
    if (this.document.visibilityState === 'visible') this.refresh();
  };

  private scheduleRefresh(now: Date): void {
    clearTimeout(this.refreshTimer);
    const parts = timeFormatter.formatToParts(now);
    const part = (name: string) => Number(parts.find((item) => item.type === name)!.value);
    const untilMidnight =
      (24 * 3600 - part('hour') * 3600 - part('minute') * 60 - part('second')) * 1000 -
      now.getMilliseconds();
    // A minute check also catches system-clock changes; the last tick targets midnight.
    this.zone.runOutsideAngular(() => {
      this.refreshTimer = setTimeout(() => this.refresh(), Math.min(60_000, untilMidnight + 25));
    });
  }
}
