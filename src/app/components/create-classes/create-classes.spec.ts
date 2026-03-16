import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateClasses } from './create-classes';

describe('CreateClasses', () => {
  let component: CreateClasses;
  let fixture: ComponentFixture<CreateClasses>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateClasses],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateClasses);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
