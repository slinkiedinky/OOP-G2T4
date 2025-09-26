package aqms.web.error;

import org.springframework.http.*; import org.springframework.web.bind.annotation.*; import java.util.Map;
@RestControllerAdvice
public class GlobalExceptionHandler {
  @ExceptionHandler({IllegalArgumentException.class, IllegalStateException.class})
  @ResponseStatus(HttpStatus.BAD_REQUEST)
  public Map<String,Object> badReq(RuntimeException ex){ return Map.of("error", ex.getClass().getSimpleName(), "message", ex.getMessage()); }
}