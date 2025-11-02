package aqms.web.error;

import org.springframework.http.*; import org.springframework.web.bind.annotation.*; import java.util.Map;
import lombok.extern.slf4j.Slf4j;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {
  @ExceptionHandler({IllegalArgumentException.class, IllegalStateException.class})
  @ResponseStatus(HttpStatus.BAD_REQUEST)
  public Map<String,Object> badReq(RuntimeException ex){ 
    return Map.of("error", ex.getClass().getSimpleName(), "message", ex.getMessage()); 
  }
  
  @ExceptionHandler(RuntimeException.class)
  @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
  public Map<String,Object> runtimeException(RuntimeException ex){
    log.error("RuntimeException: {}", ex.getMessage(), ex);
    return Map.of("error", ex.getClass().getSimpleName(), "message", ex.getMessage()); 
  }
  
  @ExceptionHandler(Exception.class)
  @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
  public Map<String,Object> generalException(Exception ex){
    log.error("Exception: {}", ex.getMessage(), ex);
    String message = ex.getMessage();
    // Check if it's a database-related error
    if (ex.getMessage() != null && ex.getMessage().contains("column") && ex.getMessage().contains("does not exist")) {
      message = "Database schema mismatch. Please restart the backend to apply migrations. Error: " + ex.getMessage();
    }
    return Map.of("error", ex.getClass().getSimpleName(), "message", message); 
  }
}