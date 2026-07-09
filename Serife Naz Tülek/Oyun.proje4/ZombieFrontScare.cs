using System.Collections;
using UnityEngine;

public class ZombieFrontScare : MonoBehaviour
{
    [Header("Zombie")]
    public GameObject zombieMonster;
    public float distanceInFront = 2.8f;
    public float heightOffset = -0.6f;
    public float visibleTime = 1.5f;

    [Header("Auto Repeat")]
    public bool startAutomatically = true;
    public float firstDelay = 8f;
    public float minRepeatDelay = 5f;
    public float maxRepeatDelay = 10f;

    [Header("Sound")]
    public AudioClip scareSound;
    public float volume = 1f;

    private Transform player;
    private AudioSource audioSource;

    void Start()
    {
        GameObject playerObj = GameObject.FindWithTag("Player");

        if (playerObj != null)
        {
            player = playerObj.transform;
        }
        else
        {
            Debug.LogError("ZombieFrontScare: Player bulunamadı. Player Tag = Player olmalı.");
        }

        audioSource = GetComponent<AudioSource>();

        if (audioSource == null)
        {
            audioSource = gameObject.AddComponent<AudioSource>();
        }

        audioSource.playOnAwake = false;
        audioSource.spatialBlend = 0f;

        if (zombieMonster != null)
        {
            zombieMonster.SetActive(false);
        }
        else
        {
            Debug.LogError("ZombieFrontScare: ZombieMonster kutusu boş.");
        }

        if (startAutomatically)
        {
            StartCoroutine(AutoScareLoop());
        }
    }

    IEnumerator AutoScareLoop()
    {
        yield return new WaitForSeconds(firstDelay);

        while (true)
        {
            yield return StartCoroutine(ShowZombieInFront());

            float waitTime = Random.Range(minRepeatDelay, maxRepeatDelay);
            yield return new WaitForSeconds(waitTime);
        }
    }

    IEnumerator ShowZombieInFront()
    {
        if (zombieMonster == null || player == null)
            yield break;

        if (scareSound != null)
        {
            audioSource.PlayOneShot(scareSound, volume);
        }

        Vector3 forward = player.forward;
        forward.y = 0f;
        forward.Normalize();

        Vector3 spawnPos = player.position + forward * distanceInFront;
        spawnPos.y = player.position.y + heightOffset;

        zombieMonster.transform.position = spawnPos;

        Vector3 lookDirection = player.position - zombieMonster.transform.position;
        lookDirection.y = 0f;

        if (lookDirection != Vector3.zero)
        {
            zombieMonster.transform.rotation = Quaternion.LookRotation(lookDirection);
        }

        zombieMonster.SetActive(true);

        yield return new WaitForSeconds(visibleTime);

        zombieMonster.SetActive(false);
    }
}