export type IntegerRangeFromZero<
    Size extends number,
    Values extends number[] = [],
> = Values["length"] extends Size
    ? Values[number]
    : IntegerRangeFromZero<Size, [...Values, Values["length"]]>;

export type FixedLengthArray<
    Item,
    Size extends number,
    Values extends Item[] = [],
> = Values["length"] extends Size
    ? Values
    : FixedLengthArray<Item, Size, [...Values, Item]>;
