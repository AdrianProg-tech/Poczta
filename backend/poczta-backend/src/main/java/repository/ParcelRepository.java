package repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import model.Parcel;

@Repository
public interface ParcelRepository extends JpaRepository<Parcel, Long> {
    // Tutaj Spring sam „dopisze” metody typu save(), findAll(), deleteById()
}