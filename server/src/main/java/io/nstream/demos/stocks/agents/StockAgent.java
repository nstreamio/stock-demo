package io.nstream.demos.stocks.agents;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import swim.api.SwimLane;
import swim.api.agent.AbstractAgent;
import swim.api.lane.CommandLane;
import swim.api.lane.ValueLane;
import swim.concurrent.TimerFunction;
import swim.concurrent.TimerRef;
import swim.structure.Form;
import swim.structure.Record;
import swim.structure.Value;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalDate;
import java.time.ZoneId;

public class StockAgent extends AbstractAgent {
  private static final Logger log = LoggerFactory.getLogger(StockAgent.class);
  @SwimLane("status")
  final ValueLane<Value> status = this.valueLane();

  @SwimLane("previousClose")
  final ValueLane<Value> previousClose = this.valueLane();

  @SwimLane("updatePreviousClose")
  final CommandLane<Value> updatePreviousClose = this.<Value>commandLane()
      .onCommand(input -> this.previousClose.set(input));


  TimerRef previousCloseTimer;

  private static final long previousCloseInterval = Duration.ofMinutes(15).toMillis();

  static LocalDate lastWeekDay() {
    LocalDate result = LocalDate.now(ZoneId.of("America/New_York"))
        .minusDays(1);

    while(DayOfWeek.SATURDAY == result.getDayOfWeek() || DayOfWeek.SUNDAY == result.getDayOfWeek()) {
      result = result.minusDays(1);
    }

    return result;
  }

  void requestPreviousClose() {
    Value previousClose = this.previousClose.get();

    if(previousClose.isDefined()) {
      Value datetimeValue = previousClose.getSlot("datetime");
      if(datetimeValue.isDefined()) {
        LocalDate closeDate = LocalDate.parse(datetimeValue.stringValue());
        LocalDate yesterday = lastWeekDay();
        if(yesterday.equals(closeDate)) {
          this.previousCloseTimer = this.setTimer(
              previousCloseInterval,
              this::requestPreviousClose
          );
          return;
        }
      }
    }

    Record request = Record.of()
        .slot("symbol", getProp("symbol"))
        .slot("nodeUri", nodeUri().toString())
        .slot("lane", "updatePreviousClose");
    command("/adapter/twelvedata", "eod", request);

    this.previousCloseTimer = this.setTimer(
        previousCloseInterval,
        this::requestPreviousClose
    );
  }



  @Override
  public void didStart() {
    this.status.set(Record.of());
    this.previousClose.set(Value.absent());

    requestPreviousClose();
    command("/symbols", "add", getProp("symbol"));
  }

  static class ValueBuilder {
    private final Value input;
    public Value output;

    ValueBuilder(Value current, Value input) {
      this.input = input;

      if (!current.isDefined()) {
        this.output = Record.of();
      } else {
        this.output = current;
      }
    }

    public <T> void set(String inputKey, String outputKey, Form<T> form, T defaultValue) {
      Value inputValue = this.input.getSlot(inputKey);
      Value outputValue = this.output.getSlot(outputKey);

      if (inputValue.equals(outputValue) && outputValue.isDefined()) {
        return;
      }

      if (!inputValue.isDefined() && outputValue.isDefined()) {
        return;
      }

      if (null != inputValue && inputValue.isDefined()) {
        T value = inputValue.cast(form, defaultValue);
        this.output = this.output.updated(outputKey, Value.fromObject(value));
      } else if (null == inputValue) {
        this.output = this.output.updated(outputKey, Value.absent());
      } else if (!inputValue.isDefined()) {
        this.output = this.output.updated(outputKey, inputValue);
      }
    }
  }

  @SwimLane("update")
  final CommandLane<Value> update = this.<Value>commandLane()
      .onCommand(input -> {

        Value priceValue = input.getSlot("price");
        ValueBuilder valueBuilder = new ValueBuilder(this.status.get(), input);
        valueBuilder.set("timestamp", "timestamp", Form.forLong(), null);
        valueBuilder.set("price", "price", Form.forDouble(), null);
        valueBuilder.set("day_volume", "volume", Form.forDouble(), null);
        valueBuilder.set("bid", "bid", Form.forDouble(), null);
        valueBuilder.set("ask", "ask", Form.forDouble(), null);

        Value previousClose = this.previousClose.get();
        Value movementValue;
        if(previousClose.isDefined() && priceValue.isDefined()) {
          Value closeValue = previousClose.getSlot("close");

          if(null != closeValue&&closeValue.isDefined()) {
            double close = closeValue.doubleValue();
            double price = priceValue.doubleValue();
            double movement = ((price - close) / close) * 100D;
            movement = new BigDecimal(movement)
                .setScale(3, RoundingMode.HALF_UP)
                .doubleValue();
            movementValue = Value.fromObject(movement);
          } else {
            movementValue = Value.absent();
          }
        } else {
          movementValue = Value.absent();
        }

        this.status.set(valueBuilder.output.updated("movement", movementValue));
      });
}
