import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  signal,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { SafeUrlPipe } from "@shared/pipes/safe-url.pipe";
import { getDeterministicAvatarUrl, getUserInitials } from "@shared/utils/avatar.util";

@Component({
  selector: "app-user-avatar",
  standalone: true,
  imports: [CommonModule, SafeUrlPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="avatar-container"
      [style.width.px]="size"
      [style.height.px]="size"
      [style.font-size.px]="fontSize"
    >
      @if (imageSrc() && !hasError()) {
        <img
          [src]="imageSrc()! | safeUrl"
          [alt]="altText"
          (error)="onImageError()"
        />
      } @else {
        <div class="avatar-fallback" aria-hidden="true">
          {{ initials() }}
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: inline-block;
        vertical-align: middle;
      }
      .avatar-container {
        border-radius: 50%;
        overflow: hidden;
        background: var(--app-bg-alt);
        color: var(--app-fg);
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid var(--app-border);
        box-shadow: var(--app-shadow-xs, 0 1px 2px rgba(0, 0, 0, 0.05));
        position: relative;
        user-select: none;
        flex-shrink: 0;
      }
      .avatar-container img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }
      .avatar-fallback {
        font-weight: 700;
        letter-spacing: -0.02em;
        line-height: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        background: var(--app-primary);
        color: var(--app-primary-text);
      }
    `,
  ],
})
export class UserAvatarComponent implements OnChanges {
  @Input() user?: { id?: string; name?: string; email?: string; avatar?: { url?: string } } | null;
  @Input() name?: string;
  @Input() avatarUrl?: string;
  @Input() userId?: string;
  @Input() size: number = 36;
  @Input() alt?: string;

  readonly hasError = signal(false);
  readonly imageSrc = signal<string | null>(null);
  readonly initials = signal<string>("U");

  get fontSize(): number {
    return Math.max(11, Math.round(this.size * 0.4));
  }

  get altText(): string {
    return this.alt || this.name || this.user?.name || "User Avatar";
  }

  ngOnChanges(_changes: SimpleChanges): void {
    this.updateAvatar();
  }

  onImageError(): void {
    const currentSrc = this.imageSrc();
    const defaultUrl = this.getFallbackDiceBearUrl();

    
    if (currentSrc && currentSrc !== defaultUrl) {
      this.hasError.set(false);
      this.imageSrc.set(defaultUrl);
    } else {
      this.hasError.set(true);
    }
  }

  private updateAvatar(): void {
    this.hasError.set(false);
    const resolvedName = this.name || this.user?.name || "";
    this.initials.set(getUserInitials(resolvedName));

    const uploadedUrl = this.avatarUrl || this.user?.avatar?.url;
    if (uploadedUrl) {
      this.imageSrc.set(uploadedUrl);
    } else {
      this.imageSrc.set(this.getFallbackDiceBearUrl());
    }
  }

  private getFallbackDiceBearUrl(): string {
    const seed = this.userId || this.user?.id || this.name || this.user?.name || this.user?.email;
    return getDeterministicAvatarUrl(seed, this.name || this.user?.name);
  }
}
