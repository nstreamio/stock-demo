package io.nstream.demos.stocks;

import swim.structure.Item;
import swim.structure.Value;
import swim.util.Builder;

import java.util.List;
import java.util.Spliterator;
import java.util.Spliterators;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

public class Utils {
  public static Value toItem(List<String> items) {
    Builder<Item, Value> builder = Value.builder();
    items.stream()
        .map(Value::fromObject)
        .forEach(builder::add);
    return builder.bind();
  }

  public static Value join(Item input) {
    String symbol = StreamSupport.stream(
            Spliterators.spliteratorUnknownSize(input.iterator(), Spliterator.ORDERED),
            false
        ).map(Item::stringValue)
        .collect(Collectors.joining(","));
    return Value.fromObject(symbol);
  }
}
