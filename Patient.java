/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */




class Patient {
     String name;
     String id;

    public Patient(String name, String id) {
        this.name = name;
        this.id = id;
    }
    
    public void SetName(String name)
    {
    
         this.name = name;
    }
    
      public void SetID(String id)
    {
    
         this.id = id;
    }
      
    public String getID()
            {
            return id;}
    
    public String getName()
            {
            return name;}
    
    
    
}
