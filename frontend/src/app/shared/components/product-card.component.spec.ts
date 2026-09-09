import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { ProductCardComponent } from "./product-card.component";
import { Product } from "@core/models/product.model";

describe("ProductCardComponent", () => {
  let component: ProductCardComponent;
  let fixture: ComponentFixture<ProductCardComponent>;

  const mockProduct: Product = {
    id: "p-1",
    name: "Headphones",
    description: "Noise canceling",
    price: 199.99,
    quantity: 15,
    userId: "seller-1",
    images: [{ id: "i1", url: "http://example.com/h.jpg", existing: true }]
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductCardComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductCardComponent);
    component = fixture.componentInstance;
    component.product = mockProduct;
    fixture.detectChanges();
  });

  it("should display product details", () => {
    expect(component).toBeTruthy();
    expect(component.product.name).toBe("Headphones");
  });
});
