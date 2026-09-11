import { TestBed } from "@angular/core/testing";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";

import { MediaService } from "./media.service";
import { MediaImage } from "@core/models/media.model";
import { Paginated } from "@core/models/paginated.model";
import { API } from "@core/config/api.config";

describe("MediaService", () => {
  let service: MediaService;
  let httpMock: HttpTestingController;

  const mockMedia: MediaImage = {
    id: "media-1",
    url: "https://jasmine.github.io/images/jasmine-white-horizontal.svg",
    contentType: "image/jpeg",
    size: 1024,
    userId: "u-1",
    productId: "p-1",
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MediaService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(MediaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it("should return correct image URL", () => {
    const url = service.getImageUrl("img-123");
    expect(url).toBe(`${API.base}${API.media.byId("img-123")}`);
  });

  it("should get total media count", () => {
    service.count().subscribe((count) => {
      expect(count).toBe(42);
    });

    const req = httpMock.expectOne(API.base + API.media.count);
    expect(req.request.method).toBe("GET");
    req.flush(42);
  });

  it("should fetch paginated user media", () => {
    const mockResponse: Paginated<MediaImage> = {
      content: [mockMedia],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 10,
    };

    service.getMediaByUser("u-1", 0, 10).subscribe((res) => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(
      API.base + API.media.byUser("u-1") + "?page=0&size=10"
    );
    expect(req.request.method).toBe("GET");
    req.flush(mockResponse);
  });

  it("should delete media file", () => {
    service.deleteMedia("media-1").subscribe();

    const req = httpMock.expectOne(API.base + API.media.delete("media-1"));
    expect(req.request.method).toBe("DELETE");
    req.flush(null);
  });
});
