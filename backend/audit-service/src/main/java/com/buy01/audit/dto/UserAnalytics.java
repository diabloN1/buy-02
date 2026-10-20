package com.buy01.audit.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;


@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserAnalytics {

    private List<TimeSeriesPoint> spentByDay;

    private List<ProductOrCategoryCount> mostBoughtProducts;

    private List<ProductOrCategoryCount> mostBoughtCategories;
}