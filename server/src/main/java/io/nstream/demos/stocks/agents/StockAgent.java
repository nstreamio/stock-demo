package io.nstream.demos.stocks.agents;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import swim.api.SwimLane;
import swim.api.agent.AbstractAgent;
import swim.api.lane.CommandLane;
import swim.api.lane.MapLane;
import swim.api.lane.ValueLane;
import swim.concurrent.TimerRef;
import swim.structure.Form;
import swim.structure.Record;
import swim.structure.Value;
import swim.uri.Uri;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.concurrent.TimeUnit;

public class StockAgent extends AbstractAgent {
  private static final Logger log = LoggerFactory.getLogger(StockAgent.class);
  @SwimLane("profile")
  final ValueLane<Value> profile = this.valueLane();
  @SwimLane("status")
  final ValueLane<Value> status = this.valueLane();
  @SwimLane("history")
  final MapLane<Long, Value> history = this.mapLane();


  static final long HISTORY_TIMER_DURATION = TimeUnit.MINUTES.toMillis(1);

  void fireHistoryTimer() {
    try {
      requestTimeSeries();
    } catch (Exception ex) {
      log.error("Exception thrown", ex);
    } finally {
      this.historyTimer = this.setTimer(HISTORY_TIMER_DURATION, this::fireHistoryTimer);
    }
  }

  TimerRef historyTimer = this.setTimer(HISTORY_TIMER_DURATION, this::fireHistoryTimer);


  DateTimeFormatter dateTimeFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
  @SwimLane("updateTimeSeries")
  final CommandLane<Value> updateTimeSeries = this.<Value>commandLane()
      .onCommand(input -> {
        Value meta = input.getSlot("meta");
        String timezone = meta.getSlot("exchange_timezone").stringValue("America/New_York");
        ZoneId tz = ZoneId.of(timezone);
        Value values = input.getSlot("values");

        values.forEach(value -> {
          String dt = value.getSlot("datetime").stringValue();
          LocalDateTime localDateTime = LocalDateTime.parse(dt, dateTimeFormatter);
          Instant instant = localDateTime.atZone(tz).toInstant();

          List<String> fields = List.of("open", "high", "low", "close", "volume");
          Record historyValue = Record.of();

          for (String field : fields) {
            Double v = value.getSlot(field).cast(Form.forDouble(), 0D);
            historyValue = historyValue.updated(field, v);
          }
          this.history.put(
              instant.toEpochMilli(),
              historyValue
          );
        });
      });

  void requestTimeSeries() {
    Value request = Record.of()
        .slot("nodeUri", nodeUri().toString())
        .slot("lane", "updateTimeSeries")
        .slot("interval", "1min")
        .slot("symbol", getProp("symbol"));

    this.command(Uri.parse("/adapter/twelvedata"), Uri.parse("timeSeries"), request);

  }

  @SwimLane("updateProfile")
  final CommandLane<Value> updateProfile = this.<Value>commandLane()
      .onCommand(this.profile::set);

  void requestProfileData() {
    Value request = Record.of()
        .slot("nodeUri", nodeUri().toString())
        .slot("lane", "updateProfile")
        .slot("symbol", getProp("symbol"));

    this.command(Uri.parse("/adapter/twelvedata"), Uri.parse("profile"), request);
  }


  @Override
  public void didStart() {
    this.status.set(Record.of());
//    requestProfileData();
    command("/symbols", "add", getProp("symbol"));
  }

  static class ValueBuilder {
    private final Value input;
    public Value output = Record.of();

    ValueBuilder(Value input) {
      this.input = input;
    }

    public <T> void setIfDefined(String inputKey, String outputKey, Form<T> form, T defaultValue) {
      Value inputValue = this.input.getSlot(inputKey);

      if (null != inputValue && inputValue.isDefined()) {
        T value = inputValue.cast(form, defaultValue);
        this.output = this.output.updated(outputKey, Value.fromObject(value));
      }
    }
  }

  @SwimLane("update")
  final CommandLane<Value> update = this.<Value>commandLane()
      .onCommand(input -> {
        ValueBuilder valueBuilder = new ValueBuilder(input);
        valueBuilder.setIfDefined("timestamp", "timestamp", Form.forLong(), null);
        valueBuilder.setIfDefined("price", "price", Form.forDouble(), null);
        valueBuilder.setIfDefined("day_volume", "volume", Form.forDouble(), null);
        this.status.set(valueBuilder.output);
      });
}
